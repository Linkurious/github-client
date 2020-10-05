const fs = require("fs");
const request = require("request");
const { exec } = require("child_process");

const GitHubAgent = require("./agent");

module.exports = class EnhancedGitHubAgent extends GitHubAgent {

  /**
   * @param {Object} options
   * @param {string} options.owner Github repo organization
   * @param {string} options.repository Repository name
   * @param {apiKey} options.apiKey API key
   * @param {string} [options.host] API host, defaults to 'api.github.com'
   * @param {number} [options.port] API endpoints port, defaults to 443
   * @param {boolean} [options.logs] Log level (true = 'all', false = 'errors')
   */
  constructor({ repository, apiKey, owner, host, port, logs = false }) {
    super({ owner, repository, apiKey, host, port });
    this._logsEnabled = logs;
  }

  /**
   * @param {string} name
   */
  _createBranch(name) {
    this._log(`Creating branch "${name}"...`);

    return this.get("git/refs/heads/master")
      .then(({ body }) => {
        return body.object.sha;
      })
      .then(sha => {
        return this.post("git/refs", {
          ref: `refs/heads/${name}`,
          sha: sha
        });
      });
  }

  /**
   * @param {Boolean} value
   */
  setLogsEnabled(value) {
    this._logsEnabled = value;
    return this;
  }

  /**
   * @param  {...string} msg
   */
  _log(...msg) {
    if (this._logsEnabled) {
      console.log(...msg);
    }
    return this;
  }

  /**
   * Creates and pushes a file into the branch
   * @param {Object} params
   * @param {string} params.content File content
   * @param {string} params.path Relative file path in the repo
   * @param {string} params.message Commit message
   * @param {string} params.branch Branch to commit
   */
  createFile({ content, path, message, branch }) {
    this._log(`Creating ${path}...`);
    return this.put(`contents/${path}`, {
      message,
      branch,
      content: new Buffer(content).toString("base64")
    }).then(({ code, body }) => {
      if (code !== 201) return Promise.reject(body);
      return body;
    });
  }


  /**
   * Creates and pushes a file into the branch
   * @param {Object} params
   * @param {string} params.content File content
   * @param {string} params.path Relative file path in the repo
   * @param {string} params.message Commit message
   * @param {string} params.branch Branch to commit
   */
  updateFile({ content, path, message, branch }) {
    return this.get(`contents/${path}`).then(({ body }) => {
      return this.createFile({ content, path, message, branch, sha: body.sha });
    });
  }

  /**
   * Creates a tag at the HEAD of the given branch
   * @param {Object} params
   * @param {string} params.tag Tag name
   * @param {string} [params.message] Commit message
   * @param {string} params.branch Branch to tag
   * @returns Promise<Object>
   */
  tagHead({ tag, message = tag, branch }) {
    this._log(`Retrieving ${branch} head sha...`);
    return this.get(`git/refs/heads/${branch}`)
      .then(({ code, body }) => {
        if (code === 404) return Promise.reject(body);
        this._log("Retrieving last commit...");
        return this.get(body.object.url);
      })
      .then(({ body }) => {
        const { sha } = body;
        this._log(`Tagging commit ${sha} on ${branch} as ${tag}`);
        return this.post("git/tags", {
          tag,
          message,
          object: sha,
          type: "commit"
        });
      })
      .then(({ code, body }) => {
        if (code !== 201) return Promise.reject(body);
        this._log("Linking tag object and commit...");
        return this.post("git/refs", {
          ref: `refs/tags/${tag}`,
          sha: body.sha
        });
      })
      .then(({ code, body }) => {
        if (code !== 201) return Promise.reject(body);
        return body;
      });
  }

  /**
   * Some files have to be pushed as blobs
   * @param {Array<{path: string, content: string, encoding: string}>} files
   * @return {Promise{{name:string, sha:string}}>}
   */
  createBlobs(files) {
    return Promise.all(
      files.map(({ path, content, encoding }) => {
        return this.post("git/blobs", { content, encoding }).then(
          ({ body }) => ({ path, sha: body.sha })
        );
      })
    );
  }

  /**
   * http://www.levibotelho.com/development/commit-a-file-with-the-github-api
   * @param {Object} params
   * @param {string} params.branch Branch to push the files
   * @param {string} params.message Commit message
   * @param {Array<Object>} params.files Files to push
   * @returns Promise<Object>
   */
  pushFiles({ branch = "master", message = "Automated commit.", files = [] }) {
    const fileTree = files.map(({ path, content, sha }) => ({
      path,
      content,
      sha,
      mode: "100644",
      type: "blob"
    }));

    this._log(`Checking branch "${branch}"...`);
    return this.get(`git/refs/heads/${branch}`)
      .then(({ code, body }) => {
        if (code === 404) return this._createBranch(branch);
        return { code, body };
      })
      .then(result => {
        this._log("Retrieving last commit...");
        return this.get(result.body.object.url);
      })
      .then(result => {
        const commit = result.body;
        const treeSha = commit.tree.sha;
        const commitSha = commit.sha;

        this._log("Creating new tree...");

        const tree = this.post("git/trees", {
          base_tree: treeSha,
          tree: fileTree
        });

        return Promise.all([commitSha, tree]);
      })
      .then(([commitSha, result]) => {
        if (result.code !== 201) return Promise.reject(result.body);
        const tree = result.body;
        this._log("Committing tree...", tree);

        return this.post("git/commits", {
          message: message,
          tree: tree.sha,
          parents: [commitSha]
        });
      })
      .then(({ body }) => {
        this._log("Pushing...", body);

        return this.patch(`git/refs/heads/${branch}`, {
          sha: body.sha,
          force: true
        });
      })
      .then(e => {
        this._log("Done!", e);
      });
  }

  /**
   * Uploads release to github
   * @param {Object} params
   * @param {string} params.tag_name Tag name
   * @param {string} params.name Name
   * @param {boolean} params.prerelease Is it a pre-release
   * @param {string} params.zipPath Zipfile to upload
   * @param {Object} params.body
   */
  uploadRelease({ tag_name, name, body, prerelease, zipName, zipPath }) {
    return this.post("releases", { tag_name, name, body, prerelease }).then(
      ({ body, code }) => {
        if (code === 422) {
          throw new Error(`release "${tag_name}" already exists`);
        }

        const release = body;
        const stats = fs.statSync(zipPath);
        const options = {
          port: this.port,
          url: release["upload_url"].replace("{?name,label}", ""),
          qs: { name: zipName },

          auth: {
            pass: "x-oauth-basic",
            user: this.apiKey
          },
          headers: {
            "User-Agent": `${this.ownerName}-Release-Agent`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/zip",
            "Content-Length": stats.size
          }
        };

        return new Promise(resolve => {
          fs.createReadStream(zipPath).pipe(
            request.post(options, (err, res) => {
              if (err) {
                throw err;
              } else if (res.statusCode !== 201) {
                throw new Error(
                  `Upload failed with HTTP code ${res.statusCode}`
                );
              } else {
                resolve();
              }
            })
          );
        });
      }
    );
  }

  /**
   * List milestones
   */
  getMilestones({ state } = {}) {
    this._log("Retrieving milestones...");
    return this.get("milestones", { state }).then(({ body }) => body);
  }

  /**
   * Closes the milestone by number
   */
  closeMilestone(number) {
    return this.patch(`milestones/${number}`, { state: "closed" }).then(
      ({ code, body }) => {
        if (code !== 200) return Promise.reject(body);
        else return body;
      }
    );
  }

  /**
   * Get all issues for the milestone
   * @param {Object} params
   * @param {string} params.milestone Milestone
   * @param {string} state
   * @return Promise<Array<Object>>
   */
  getIssues({ state, milestone } = {}) {
    this._log("Retrieving issues...");
    return this.get("issues", { state, milestone }).then(({ body }) => body);
  }

  getReleases() {
    return this.get("releases").then(({ body }) => body);
  }

  getCurrentBranch() {
    // for the CI
    if (process.env.GIT_BRANCH) return Promise.resolve(process.env.GIT_BRANCH);
    return new Promise((resolve, reject) => {
      exec("git rev-parse --abbrev-ref HEAD", (err, res) => {
        if (err) return reject(err);
        resolve(res.trim());
      });
    });
  }
};
