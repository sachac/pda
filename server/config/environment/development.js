'use strict';

// Development specific configuration
// ==================================
module.exports = {
 ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            undefined,

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/pda2-dev'
  },

  seedDB: true
};
