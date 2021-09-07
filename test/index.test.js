
const Client = require('../');
const { assert } = require('chai');
const path = require('path');
const { version } = require('../package.json');

const API_KEY = process.env.GITHUB_API_TOKEN;

const owner = 'Linkurious';
const repository = 'github-client';
const apiKey = 'apiKey';

const getClient = () => new Client({
  repository: 'github-agent',
  owner: 'Linkurious',
  apiKey: API_KEY
});

describe('Github client', () => {

  it('instance', () => {
    const client = new Client({ repository, owner, apiKey });

    assert.equal(client.ownerName, owner);
    assert.equal(client.repoName, repository);
    assert.equal(client.apiKey, apiKey);

    assert.equal(client.host, 'api.github.com');
    assert.equal(client.port, 443);
  });

  it('repo url', () => {
    const client = new Client({ repository, owner, apiKey });

    assert.equal(
      client.repoUrl('suffix'),
      'https://api.github.com/repos/Linkurious/github-client/suffix'
    );
  });

});

describe('API calls', () => {

  it.only('should be able to get the milestones', () => {
    const client = getClient();
    return client.getMilestones().then(milestones => {
      console.log(milestones);
    });
  });


  it.skip('should be able to create a file', () => {
    const client = getClient();
    const fileName = 'file.txt';
    return client.createFile({
      content: 'empty',
      path: `test/${fileName}`,
      message: `[test] Created ${fileName}`,
      branch: 'test'
    }).then(res => {
      const { name } = res.content;
      assert.equal(name, fileName);
    });
  });

  it.skip('should be able to update a file', () => {
    const client = getClient();
    const fileName = 'file.txt';
    const message = `[test] Updated ${fileName}`;
    return client.updateFile({
      content: 'not empty',
      path: `test/${fileName}`,
      message,
      branch: 'test'
    }).then(res => {
      assert.equal(res.commit.message, message);
    });
  });

  it.skip('should be able to remove a file', () => {
    const client = getClient();
    const fileName = 'file.txt';
    const message = `[test] Deleted ${fileName}`;
    return client.removeFile({
      path: `test/${fileName}`,
      message,
      branch: 'test'
    }).then(res => {
      assert.equal(res.commit.message, message);
    });
  });

  it('get release', () => {
    const client = getClient();
    return client.getRelease('v1.1.0')
      .then(release => assert.equal(release.id, 32628987));
  });

  it.skip('should be able to upload a release', () => {
    const client = getClient();
    const name = `GH agent v${version}`;
    const body = '### Markdown';
    return client.uploadRelease({
      tag_name: 'v3.0.0-test',
      name, body,
      zipPath: path.join(process.cwd(), 'test', 'test.tgz'),
      zipName: 'release-asset.tgz',
      contentType: 'application/gzip'
    }).then((release) => {
      assert.equal(release.name, name);
      assert.equal(release.body, body);
      assert.equal(release.assets.length, 1);
      assert.equal(release.assets[0].name, 'release-asset.tgz');
    })
      .then(() => client.deleteRelease('v3.0.0-test'));
  });
});


