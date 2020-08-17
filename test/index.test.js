
const Client = require("../");
const { assert } = require("chai");

const owner = "Linkurious";
const repository = "github-client";
const apiKey = "apiKey";

describe("Github client", function () {

  it("instance", function () {
    const client = new Client({ repository, owner, apiKey });

    assert.equal(client.ownerName, owner);
    assert.equal(client.repoName, repository);
    assert.equal(client.apiKey, apiKey);

    assert.equal(client.host, "api.github.com");
    assert.equal(client.port, 443);
  });

  it("repo url", function () {
    const client = new Client({ repository, owner, apiKey });

    assert.equal(
      client.repoUrl("suffix"),
      "https://api.github.com/repos/Linkurious/github-client/suffix"
    );
  });
});
