const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/database');

const DATA_DIR = dbConfig.dataDir;
const DATA_FILES = {
  persons: dbConfig.contactsFile,
  companies: dbConfig.companiesFile,
  organizations: dbConfig.organizationsFile,
  tags: dbConfig.tagsFile
};

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 批量写入队列和防抖机制
const writeQueue = new Map();
const writeTimeouts = new Map();
const WRITE_DEBOUNCE_MS = 500; // 500ms防抖

/**
 * 异步加载数据文件
 * @param {string} type - 数据类型
 * @returns {Promise<Array>} 数据数组
 */
const loadDataFromFile = async (type) => {
  const filePath = path.join(DATA_DIR, DATA_FILES[type]);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`成功加载 ${type} 数据: ${Array.isArray(parsed) ? parsed.length : 0} 条记录`);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`文件 ${filePath} 不存在，返回空数组`);
      return [];
    }
    console.error(`读取文件 ${filePath} 失败:`, error.message);
    throw new Error(`读取${type}数据失败: ${error.message}`);
  }
};

/**
 * 异步保存数据文件（带防抖）
 * @param {string} type - 数据类型
 * @param {Array} data - 要保存的数据
 * @returns {Promise<void>}
 */
const saveDataToFile = async (type, data) => {
  return new Promise((resolve, reject) => {
    // 将数据加入队列
    writeQueue.set(type, data);
    
    // 清除之前的定时器
    if (writeTimeouts.has(type)) {
      clearTimeout(writeTimeouts.get(type));
    }
    
    // 设置新的防抖定时器
    const timeout = setTimeout(async () => {
      try {
        const dataToWrite = writeQueue.get(type);
        if (!dataToWrite) {
          resolve();
          return;
        }
        
        await executeWrite(type, dataToWrite);
        writeQueue.delete(type);
        writeTimeouts.delete(type);
        resolve();
      } catch (error) {
        writeQueue.delete(type);
        writeTimeouts.delete(type);
        reject(error);
      }
    }, WRITE_DEBOUNCE_MS);
    
    writeTimeouts.set(type, timeout);
  });
};

/**
 * 立即保存数据文件（不使用防抖）
 * @param {string} type - 数据类型
 * @param {Array} data - 要保存的数据
 * @returns {Promise<void>}
 */
const saveDataToFileImmediate = async (type, data) => {
  // 取消防抖写入
  if (writeTimeouts.has(type)) {
    clearTimeout(writeTimeouts.get(type));
    writeTimeouts.delete(type);
  }
  writeQueue.delete(type);
  
  await executeWrite(type, data);
};

/**
 * 执行实际的文件写入操作
 * @param {string} type - 数据类型
 * @param {Array} data - 要保存的数据
 * @returns {Promise<void>}
 */
const executeWrite = async (type, data) => {
  const filePath = path.join(DATA_DIR, DATA_FILES[type]);
  
  try {
    // 验证数据格式
    if (!Array.isArray(data)) {
      throw new Error(`${type}数据必须是数组格式`);
    }
    
    // 创建备份
    const backupPath = `${filePath}.backup`;
    if (fs.existsSync(filePath)) {
      await fs.promises.copyFile(filePath, backupPath);
    }
    
    // 写入数据
    const jsonData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, jsonData, 'utf8');
    
    console.log(`${type}数据已保存: ${data.length} 条记录 -> ${filePath}`);
    
    // 删除备份文件（保存成功后）
    if (fs.existsSync(backupPath)) {
      await fs.promises.unlink(backupPath);
    }
  } catch (error) {
    console.error(`保存${type}数据到 ${filePath} 失败:`, error.message);
    
    // 尝试恢复备份
    const backupPath = `${filePath}.backup`;
    if (fs.existsSync(backupPath)) {
      try {
        await fs.promises.copyFile(backupPath, filePath);
        console.log(`已从备份恢复 ${filePath}`);
      } catch (restoreError) {
        console.error(`恢复备份失败:`, restoreError.message);
      }
    }
    
    throw new Error(`保存${type}数据失败: ${error.message}`);
  }
};

/**
 * 批量保存所有待写入的数据
 * @returns {Promise<void>}
 */
const flushAllWrites = async () => {
  const writePromises = [];
  
  for (const [type, data] of writeQueue.entries()) {
    // 清除定时器
    if (writeTimeouts.has(type)) {
      clearTimeout(writeTimeouts.get(type));
      writeTimeouts.delete(type);
    }
    
    writePromises.push(executeWrite(type, data));
  }
  
  writeQueue.clear();
  await Promise.all(writePromises);
};

// 同步文件操作（保持向后兼容，但不推荐使用）
const syncFileOps = {
  loadData: (type) => {
    console.warn('警告: 使用同步文件操作可能影响性能，建议使用异步版本');
    const filePath = path.join(DATA_DIR, DATA_FILES[type]);
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`文件 ${filePath} 不存在，返回空数组`);
        return [];
      }
      console.error(`读取文件 ${filePath} 失败:`, error.message);
      return [];
    }
  },
  
  saveData: (type, data) => {
    console.warn('警告: 使用同步文件操作可能影响性能，建议使用异步版本');
    const filePath = path.join(DATA_DIR, DATA_FILES[type]);
    try {
      if (!Array.isArray(data)) {
        throw new Error(`${type}数据必须是数组格式`);
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`${type}数据已同步保存: ${data.length} 条记录`);
    } catch (error) {
      console.error(`同步保存${type}数据失败:`, error.message);
      throw error;
    }
  }
};

// 进程退出时确保所有数据都已保存
process.on('SIGINT', async () => {
  console.log('正在保存所有待写入数据...');
  try {
    await flushAllWrites();
    console.log('数据保存完成');
  } catch (error) {
    console.error('保存数据时出错:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('正在保存所有待写入数据...');
  try {
    await flushAllWrites();
    console.log('数据保存完成');
  } catch (error) {
    console.error('保存数据时出错:', error.message);
  }
  process.exit(0);
});

module.exports = {
  loadDataFromFile,
  saveDataToFile,
  saveDataToFileImmediate,
  flushAllWrites,
  syncFileOps
};