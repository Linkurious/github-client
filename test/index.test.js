
const Client = require('../');
const { assert } = require('chai');

const API_KEY = 'a0b7f08e6f1853c9d4cb1f6f3006329d489f9f67';

const owner = 'Linkurious';
const repository = 'github-client';
const apiKey = 'apiKey';

const getClient = () => new Client({
  repository: 'github-agent',
  owner: 'Linkurious',
  apiKey: API_KEY,
  logs: true
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



  it('should be able to create a file', () => {
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

  it('should be able to update a file', () => {
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

  it('should be able to remove a file', () => {
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
});


