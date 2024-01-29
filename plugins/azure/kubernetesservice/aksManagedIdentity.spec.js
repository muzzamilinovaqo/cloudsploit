var expect = require('chai').expect;
var aksManagedIdentity = require('./aksManagedIdentity');

const managedClusters = [
    {
        "id": '/subscriptions/123/resourceGroups/aqua-resource-group/providers/Microsoft.ContainerService/managedClusters/tes-cluster',
        "location": 'eastus',
        "name": 'tes-cluster',
        "type": 'Microsoft.ContainerService/ManagedClusters',
        "provisioningState": 'Succeeded',
        "kubernetesVersion": '1.18.14',
        "dnsPrefix": 'tes-cluster-dns',
        "fqdn": 'tes-cluster-dns-f7b98b1e.hcp.eastus.azmk8s.io',
        "enableRBAC": true,
        "maxAgentPools": 10,
        "identity": {
            "type": 'SystemAssigned'
        } 
    },
    {
        "id": '/subscriptions/123/resourceGroups/aqua-resource-group/providers/Microsoft.ContainerService/managedClusters/tes-cluster',
        "location": 'eastus',
        "name": 'tes-cluster',
        "type": 'Microsoft.ContainerService/ManagedClusters',
        "provisioningState": 'Succeeded',
        "kubernetesVersion": '1.18.14',
        "dnsPrefix": 'tes-cluster-dns',
        "fqdn": 'tes-cluster-dns-f7b98b1e.hcp.eastus.azmk8s.io',
        "enableRBAC": false,
        "maxAgentPools": 10,
    }
];

const createCache = (managedClusters) => {
    return {
        managedClusters: {
            list: {
                'eastus': {
                    data: managedClusters
                }
            }
        }
    };
};

const createErrorCache = () => {
    return {
        managedClusters: {
            list: {
                'eastus': {}
            }
        }
    };
};

describe('aksManagedIdentity', function() {
    describe('run', function() {
        it('should give passing result if no clusters', function(done) {
            const cache = createCache([]);
            aksManagedIdentity.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('No existing Kubernetes clusters');
                expect(results[0].region).to.equal('eastus');
                done();
            });
        });

        it('should give failing result if Managed Identity is not enabled on kubernetes clusters', function(done) {
            const cache = createCache([managedClusters[1]]);
            aksManagedIdentity.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(2);
                expect(results[0].message).to.include('The managed cluster does not have an identity assigned');
                expect(results[0].region).to.equal('eastus');
                done();
            });
        });

        it('should give unknown result if unable to query for kubernetes clusters', function(done) {
            const cache = createErrorCache();
            aksManagedIdentity.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(3);
                expect(results[0].message).to.include('Unable to query for Kubernetes clusters: ');
                expect(results[0].region).to.equal('eastus');
                done();
            });
        });

        it('should give passing result if  Managed Identity is enabled on kubernetes clusters', function(done) {
            const cache = createCache([managedClusters[0]]);
            aksManagedIdentity.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('The managed cluster has identities assigned');
                expect(results[0].region).to.equal('eastus');
                done();
            });
        });
    });
});