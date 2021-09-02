## Github API client

For releases etc.

## Install

```
npm i --save-dev linkurious/github-agent
```

## API

```js
const Client = require('@linkurious/github-client');

const client = new Client({
  owner: 'Linkurious',
  repository: 'github-client',
  apiKey: 'GITHUB_API_KEY'
});
```

* **`.createFile({ content:string, path:string, message:string, branch:string }): Promise`**

Creates and pushes a file into the branch

* **`.updateFile({ content:string, path:string, message:string, branch:string }): Promise`**

Updates and pushes a file into the branch

* **`.removeFile({ content:string, path:string, message:string, branch:string }): Promise`**

Removes file from the branch

* **`.tagHead({ tag, message = tag, branch }): Promise`**

Creates a tag at the HEAD of the given branch

* **`.createBlobs(Array<{path: string, content: string, encoding: string}>):Promise<{ path: string, sha: string }>`**

Push blobs to Github API and retrieve SHAs

* **`.pushFiles({ branch = 'master', message = 'Automated commit.', files: Array<{ path, content, sha }> = [] }): Promise`**

Push files to branch

* **`.uploadRelease({ tag_name, name, body, prerelease, zipName, zipPath }): Promise`**

Upload release package attached to the tag

* **`.getMilestones({ state: 'open' | 'closed' } = {}): Promise<object[]>`**

Get list of repo's milestones

* **`.closeMilestone(id: number): Promise`**

Close milestone by id

* **`.getIssues({ state: 'open' | 'closed', milestone: number } = {}): Promise<object[]>`**

Get all issues for the milestone

* **`.getReleases(): Promise<object[]>`**

Get all releases

* **`.getCurrentBranch():Promise<string>`**

Get current branch name. First reads from `process.env.GIT_BRANCH`, then from git command.


## License

Linkurious &copy; 2020
