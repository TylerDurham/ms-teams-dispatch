const path = require("path");
const chai = require("chai");
const pkg = require("../package.json");
const expect = chai.expect

const BASE_URL = "http://localhost:7071";
const functionName = path.basename(__dirname);

const axios = require('axios').default.create({
    baseURL: BASE_URL
})

describe(`Testing Azure Function "${functionName}".`, () => {

    const sampleData = function () {
        return {
            userId: "user@domain.com",
            command: "com-microsoft-teams:dispatch:echo-teams-env",
            callback: `${BASE_URL}/api/session/test`
        }
    }

    it("default", (done) => {
        const inputs = sampleData()
        axios.post("/api/session", inputs)
            .then((response) => {
                const headers = response.headers;
                const data = response.data;     //console.log(data);

                // Check HTTP stuff
                expect(response.status).to.equal(200)
                expect(headers["content-type"]).to.include("application/json", "response.headers['content-type']")
                expect(headers["server"]).to.be.empty;

                // Check data returned
                expect(data.type).to.equal(0, "response.data.type");
                for (const prop in inputs) {
                    expect(data.value[prop]).to.equal(inputs[prop], `data.value.${prop}`);
                }
                expect(data.value.version).to.equal(pkg.version, "data.value.version");
                expect(data.value.status).to.equal(1, "data.value.status");
                expect(data.value.id).to.be.a.string;

                done();
            })
            .catch((err) => {
                //console.error(err)
                done(err)
            })
    });
    it("bad header: accept", () => {
        axios.post("/api/session", sampleData(), {
            validateStatus: function (status) {
                return status < 501
            }
        })
    });
});