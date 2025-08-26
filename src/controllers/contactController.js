const Contact = require('../models/contactModel');

// 获取所有联系人
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.getAllContacts();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 根据ID获取联系人
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: '联系人不存在' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建新联系人
const createContact = async (req, res) => {
  try {
    const newContact = await Contact.createContact(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新联系人
const updateContact = async (req, res) => {
  try {
    console.log(`[DEBUG] 更新联系人请求 - ID: ${req.params.id}`);
    console.log(`[DEBUG] 更新数据:`, JSON.stringify(req.body, null, 2));
    
    const updatedContact = await Contact.updateContact(req.params.id, req.body);
    
    console.log(`[DEBUG] 联系人更新成功 - ID: ${req.params.id}`);
    console.log(`[DEBUG] 更新后的数据:`, JSON.stringify(updatedContact, null, 2));
    
    res.json(updatedContact);
  } catch (error) {
    console.error(`[ERROR] 更新联系人失败 - ID: ${req.params.id}, 错误:`, error.message);
    if (error.message === '联系人不存在') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// 删除联系人
const deleteContact = async (req, res) => {
  try {
    await Contact.deleteContact(req.params.id);
    res.json({ message: '联系人删除成功' });
  } catch (error) {
    if (error.message === '联系人不存在') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
};