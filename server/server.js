const express = require('express');
const cors = require('cors');  // 引入 CORS 中间件
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;
const winston = require('winston');  // 使用 winston 进行日志记录

app.use(cors());  // 启用 CORS
app.use(express.json());

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'retirement_calculation.log' }), // 保存日志到文件
    new winston.transports.Console() // 同时在控制台输出日志
  ]
});

// 服务 React 构建的静态文件
app.use(express.static(path.join(__dirname, '../retirement-calculator/build')));

// 计算退休年龄和退休时间
app.post('/api/calculate', (req, res) => {
  const { birthDate, personType } = req.body;
  const birthYear = parseInt(birthDate.split('-')[0], 10);
  const birthMonth = parseInt(birthDate.split('-')[1], 10);

  // 日志记录 - 开始计算
  logger.info(`开始计算退休年龄: 出生年月 = ${birthYear}-${birthMonth}, 人员类型 = ${personType}`);

  let a, b, A, B, X = 0; // a = 改革后法定退休年龄（年数），b = 月份部分，A = 退休年，B = 退休月，X = 进位标志
  let d = 0; // 延迟月数
  let minimumYears = 15; // 最低缴费年限的基础值
  let earlyRetirementYear, earlyRetirementMonth, lateRetirementYear, lateRetirementMonth;
  let addedMonths = 0;  // 确保 addedMonths 被初始化为 0
  
  // 处理男职工的情况
  if (personType === 'male') {
    if (birthYear < 1965) {
      // 如果出生时间在1965年1月之前，退休年龄为60岁，没有延迟
      a = 60;
      b = 0;
      d = 0;
      A = birthYear + a;
      B = birthMonth;
      logger.info(`出生于1965年1月之前，退休年龄为: ${a}岁`);
    } else {
      // 出生时间在1965年1月或之后，按每4个月延迟1个月的规则计算
      d = Math.floor(((birthYear - 1965) * 12 + (birthMonth - 1)) / 4) + 1;
      d = Math.max(0, Math.min(d, 36));  // 确保 d 在 0 到 36 之间
      a = 60 + Math.floor(d / 12);  // 改革后法定退休年龄的年数部分
      b = d % 12;  // 改革后法定退休年龄的月份部分

      // 计算退休时间
      A = birthYear + a;
      B = birthMonth + b;
      if (B > 12) {
        X = 1;
        B = B - 12;  // 进位调整
      }
      A = A + X;  // 如果有进位，年份增加

      logger.info(`改革后法定退休年龄: ${a}岁 ${b}个月, 延迟月数: ${d}个月`);
    }

    // 计算最低缴费年限
    if (A >= 2030) {
      // 从2030年起，包含2030年，最低缴费年限每年增加6个月
      const yearsAfter2030 = A - 2030 + 1;  // 从2030年起，当年增加6个月，因此要+1
      const addedMonths = Math.min(yearsAfter2030 * 6, 60);  // 每年增加6个月，最多增加5年（60个月）
      minimumYears = 15 + Math.floor(addedMonths / 12);
      const extraMonths = addedMonths % 12;
      logger.info(`2030年及之后的最低缴费年限: ${minimumYears}年${extraMonths}个月`);
    } else {
      logger.info(`2030年之前的最低缴费年限: 15年`);
    }

    // 自愿提前退休的时间: 出生年月 + 60岁（原法定退休年龄）
    earlyRetirementYear = birthYear + 60;
    earlyRetirementMonth = birthMonth;

    // 自愿延长退休的时间: 改革后法定退休年龄 + 3年
    lateRetirementYear = A + 3;
    lateRetirementMonth = B;
    logger.info(`自愿提前退休时间: ${earlyRetirementYear}年${earlyRetirementMonth}月, 自愿延长退休时间: ${lateRetirementYear}年${lateRetirementMonth}月`);

  }

  // 处理女职工（55岁退休）
  if (personType === 'female55') {
    if (birthYear < 1970) {
      // 如果出生时间在1970年1月之前，退休年龄为55岁，没有延迟
      a = 55;
      b = 0;
      d = 0;
      A = birthYear + a;
      B = birthMonth;
      logger.info(`出生于1970年1月之前，退休年龄为: ${a}岁`);
    } else {
      // 出生时间在1970年1月或之后，按每4个月延迟1个月的规则计算
      d = Math.floor(((birthYear - 1970) * 12 + (birthMonth - 1)) / 4) + 1;
      d = Math.max(0, Math.min(d, 36));  // 确保 d 在 0 到 36 之间
      a = 55 + Math.floor(d / 12);  // 改革后法定退休年龄的年数部分
      b = d % 12;  // 改革后法定退休年龄的月份部分

      // 计算退休时间
      A = birthYear + a;
      B = birthMonth + b;
      if (B > 12) {
        X = 1;
        B = B - 12;  // 进位调整
      }
      A = A + X;  // 如果有进位，年份增加

      logger.info(`改革后法定退休年龄: ${a}岁 ${b}个月, 延迟月数: ${d}个月`);
    }

        // 计算最低缴费年限
    if (A >= 2030) {
      // 从2030年起，包含2030年，最低缴费年限每年增加6个月
      const yearsAfter2030 = A - 2030 + 1;  // 从2030年起，当年增加6个月，因此要+1
      const addedMonths = Math.min(yearsAfter2030 * 6, 60);  // 每年增加6个月，最多增加5年（60个月）
      minimumYears = 15 + Math.floor(addedMonths / 12);
      const extraMonths = addedMonths % 12;
      logger.info(`2030年及之后的最低缴费年限: ${minimumYears}年${extraMonths}个月`);
    } else {
      logger.info(`2030年之前的最低缴费年限: 15年`);
    }
    
    // 自愿提前退休的时间: 出生年月 + 55岁（原法定退休年龄）
    earlyRetirementYear = birthYear + 55;
    earlyRetirementMonth = birthMonth;

    // 自愿延长退休的时间: 改革后法定退休年龄 + 3年
    lateRetirementYear = A + 3;
    lateRetirementMonth = B;
    logger.info(`自愿提前退休时间: ${earlyRetirementYear}年${earlyRetirementMonth}月, 自愿延长退休时间: ${lateRetirementYear}年${lateRetirementMonth}月`);

  }

  // 处理女职工（50岁退休）
  if (personType === 'female50') {
    if (birthYear < 1975) {
      // 如果出生时间在1975年1月之前，退休年龄为50岁，没有延迟
      a = 50;
      b = 0;
      d = 0;
      A = birthYear + a;
      B = birthMonth;
      logger.info(`出生于1975年1月之前，退休年龄为: ${a}岁`);
    } else {
      // 出生时间在1975年1月或之后，按每2个月延迟1个月的规则计算
      d = Math.floor(((birthYear - 1975) * 12 + (birthMonth - 1)) / 2) + 1;
      d = Math.max(0, Math.min(d, 60));  // 确保 d 在 0 到 30 之间
      a = 50 + Math.floor(d / 12);  // 改革后法定退休年龄的年数部分
      b = d % 12;  // 改革后法定退休年龄的月份部分

      // 计算退休时间
      A = birthYear + a;
      B = birthMonth + b;
      if (B > 12) {
        X = 1;
        B = B - 12;  // 进位调整
      }
      A = A + X;  // 如果有进位，年份增加

      logger.info(`改革后法定退休年龄: ${a}岁 ${b}个月, 延迟月数: ${d}个月`);
    }

    // 计算最低缴费年限
    if (A >= 2030) {
      // 从2030年起，包含2030年，最低缴费年限每年增加6个月
      const yearsAfter2030 = A - 2030 + 1;  // 从2030年起，当年增加6个月，因此要+1
      const addedMonths = Math.min(yearsAfter2030 * 6, 60);  // 每年增加6个月，最多增加5年（60个月）
      minimumYears = 15 + Math.floor(addedMonths / 12);
      const extraMonths = addedMonths % 12;
      logger.info(`2030年及之后的最低缴费年限: ${minimumYears}年${extraMonths}个月`);
    } else {
      logger.info(`2030年之前的最低缴费年限: 15年`);
    }
    
    // 自愿提前退休的时间: 出生年月 + 50岁（原法定退休年龄）
    earlyRetirementYear = birthYear + 50;
    earlyRetirementMonth = birthMonth;

    // 自愿延长退休的时间: 改革后法定退休年龄 + 3年
    lateRetirementYear = A + 3;
    lateRetirementMonth = B;
    logger.info(`自愿提前退休时间: ${earlyRetirementYear}年${earlyRetirementMonth}月, 自愿延长退休时间: ${lateRetirementYear}年${lateRetirementMonth}月`);

  }

  // 返回计算结果
  res.json({
    retirementAgeYears: a,        // 改革后法定退休年龄的年数部分
    retirementAgeMonths: b,       // 改革后法定退休年龄的月份部分
    retirementDate: `${A}-${B}`,  // 改革后退休时间
    delayMonths: d,               // 延迟月数
    minimumContributionYears: `${minimumYears}年 ${addedMonths ? addedMonths : 0}个月`, // 最低缴费年限
    earlyRetirement: `${earlyRetirementYear}-${earlyRetirementMonth}`, // 自愿提前退休时间
    lateRetirement: `${lateRetirementYear}-${lateRetirementMonth}`     // 自愿延长退休时间
  });

  // 日志记录 - 计算完成
  logger.info(`延迟月数: ${d}个月, 改革后退休时间: ${A}年${B}月, 最低缴费年限: ${minimumYears}年${addedMonths ? addedMonths : 0}个月`);
});


// React 路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../retirement-calculator/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
