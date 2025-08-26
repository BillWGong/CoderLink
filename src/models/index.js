const { Contact, loadInitialData } = require('./contactModel');
const { Company } = require('./companyModel');
const { Organization } = require('./organizationModel');

module.exports = {
  Contact,
  Company,
  Organization,
  loadData: loadInitialData
}; 