var async = require('async');
const helpers = require('../../../helpers/azure');

module.exports = {
    title: 'Event Grid Domain Minimum TLS Version',
    category: 'Event Grid',
    domain: 'Management and Governance',
    severity: 'Medium',
    description: 'Ensures that Azure Event Grid domain is using the latest TLS version.',
    more_info: 'Using latest TLS version for Event Grid domains enforces strict security measures, which requires that clients send and receive data with a newer version of TLS.',
    recommended_action: 'Modify Event Grid domain to set the desired minimum TLS version.',
    link: 'https://learn.microsoft.com/en-us/azure/event-grid/transport-layer-security-configure-minimum-version',
    apis: ['eventGrid:listDomains'],
    settings: {
        event_grid_domain_min_tls_version: {
            name: 'Event Grid Domain Minimum TLS Version',
            description: 'Minimum desired TLS version for Event Grid domain',
            regex: '^(1.0|1.1|1.2)$',
            default: '1.2'
        }
    },
    realtime_triggers: ['microsofteventgrid:domains:write', 'microsofteventgrid:domains:delete'],

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var locations = helpers.locations(settings.govcloud);

        var config = {
            event_grid_domain_min_tls_version: settings.event_grid_domain_min_tls_version || this.settings.event_grid_domain_min_tls_version.default
        };

        var desiredVersion = parseFloat(config.event_grid_domain_min_tls_version);

        async.each(locations.eventGrid, function(location, rcb) {
            const domains = helpers.addSource(cache, source, 
                ['eventGrid', 'listDomains', location]);

            if (!domains) return rcb();

            if (domains.err || !domains.data) {
                helpers.addResult(results, 3,
                    'Unable to query for Event Grid domains: ' + helpers.addError(domains), location);
                return rcb();
            }

            if (!domains.data.length) {
                helpers.addResult(results, 0, 'No Event Grid domains found', location);
                return rcb();
            }

            for (let domain of domains.data){
                if (!domain.id) continue;
                
                if (domain.minimumTlsVersionAllowed && parseFloat(domain.minimumTlsVersionAllowed) >= desiredVersion) {
                    helpers.addResult(results, 0,
                        `Event Grid domain is using TLS version ${domain.minimumTlsVersionAllowed} which is equal to or higher than desired TLS version ${config.event_grid_domain_min_tls_version}`,
                        location, domain.id);
                } else {
                    helpers.addResult(results, 2,
                        `Event Grid domain is using TLS version ${domain.minimumTlsVersionAllowed} which is less than desired TLS version ${config.event_grid_domain_min_tls_version}`,
                        location, domain.id);
                }
            }

            rcb();
        }, function() {
            callback(null, results, source);
        });
    }
};
