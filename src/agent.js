const request = require('request');

/**
 * @typedef {"GET"|"POST"|"HEAD"|"PUT"|"DELETE"} Method
 */

module.exports = class GitHubAgent {

  /**
   * @param {Object} options
   * @param {string} options.owner Github repo organization
   * @param {string} options.repository Repository name
   * @param {apiKey} options.apiKey API key
   * @param {string} [options.host] API host, defaults to 'api.github.com'
   * @param {number} [options.port] API endpoints port, defaults to 443
   */
  constructor({ owner, repository, apiKey, host = 'api.github.com', port = 443 }) {
    if (!owner || typeof owner !== 'string') {
      throw new Error('Missing \'owner\' field');
    }
    if (!repository || typeof repository !== 'string') {
      throw new Error('Missing \'repository\' field');
    }
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Missing \'apiKey\' field');
    }

    this.ownerName = owner;
    this.repoName = repository;
    this.apiKey = apiKey;
    this.host = host;
    this.port = port;
  }

  /**
   * Get an URL relative to the current repo
   *
   * @param {string} [path]
   * @returns {string} an URL
   */
  repoUrl(path) {
    const prefix =
      `https://${this.host}/repos/${this.ownerName}/${this.repoName}/`;

    if (path.indexOf(prefix) === 0) return path;
    return prefix + path;

  }

  /**
   * @param {Method} method
   * @param {*} url
   * @param {*} query
   * @param {*} body
   */
  req(method, url, query, body) {
    const options = {
      url: this.repoUrl(url),
      method,
      query,
      body
    };
    return this._request(options);
  }

  /**
   *
   * @param {String} url
   * @param {*} parameters
   */
  get(url, parameters) {
    return this.req('get', url, parameters);
  }

  post(url, parameters) {
    return this.req('post', url, undefined, parameters);
  }

  put(url, parameters) {
    return this.req('put', url, undefined, parameters);
  }

  patch(url, parameters) {
    return this.req('patch', url, undefined, parameters);
  }

  delete(url, parameters) {
    return this.req('delete', url, undefined, parameters);
  }

  /**
   * @param {object} options
   * @param {string} [options.url] expected response status
   * @param {string} [options.method] used HTTP request method
   * @param {object} [options.body] the post/put body, send as JSON
   * @param {object} [options.query] the query string arguments
   * @returns {Promise.<object|Error>}
   */
  _request(options) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method,
        uri: options.url,
        body: options.body,
        qs: options.query,
        json: true,
        headers: {
          'User-Agent': 'Github-Agent',
          Accept: 'application/vnd.github.v3+json'
        }
      };
      requestOptions.auth = {
        pass: 'x-oauth-basic',
        user: this.apiKey
      };
      this._getPage(requestOptions, resolve, reject);
    });
  }

  _getPage(options, resolve, reject, bodyAcc) {
    request(options, (err, res) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      let body = res.body;
      const code = res.statusCode;
      const url =
        res.headers.link && res.headers.link.match(/^<([^>]+)>; rel="next"/);

      if (code >= 500 && code <= 599) {
        throw new Error('HTTP code 500 returned');
      }

      if (url) {
        const nextUrl = url[1];
        options.uri = nextUrl;

        if (!bodyAcc) bodyAcc = [];

        if (body instanceof Array) {
          bodyAcc = bodyAcc.concat(body);
        } else {
          bodyAcc.push(body);
        }

        this._getPage(options, resolve, reject, bodyAcc);
      } else {
        if (bodyAcc) {
          if (body instanceof Array) {
            body = bodyAcc.concat(body);
          } else {
            bodyAcc.push(body);
            body = bodyAcc;
          }
        }
        resolve({ body, code });
      }
    });
  }
};
