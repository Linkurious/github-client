
const Client = require('../');
const { assert } = require('chai');
const { execSync } = require('child_process');

function getEnvVariable(variable) {
  return execSync(`echo $${variable}`).toString();
}

const owner = 'Linkurious';
const repository = 'github-client';
const apiKey = 'apiKey';

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

  it('should be able to update a file', () => {
    const key = getEnvVariable('API_KEY');
    console.log('put out', key);
  });
});


