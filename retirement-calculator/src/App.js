import React, { useState } from 'react';

function App() {
  const [birthDate, setBirthDate] = useState('');
  const [personType, setPersonType] = useState('male');
  const [retirementData, setRetirementData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');  // 错误信息

  // 验证用户输入的日期是否合法
  const validateDate = (birthDate) => {
    if (!birthDate) return false;

    const [year, month] = birthDate.split('-');
    if (year.length !== 4 || isNaN(year) || month.length !== 2 || isNaN(month)) {
      return false;
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    // 年份应为四位数，月份应为 1-12
    if (yearNum < 1000 || yearNum > 9999 || monthNum < 1 || monthNum > 12) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证出生年月的输入格式
    if (!validateDate(birthDate)) {
      setErrorMessage('请输入有效的出生年月（例如：1980-05）');
      return;
    }

    // 清除错误信息
    setErrorMessage('');

    // 发送请求到后端
    const response = await fetch('http://localhost:5000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ birthDate, personType }),
    });

    if (response.ok) {
      const result = await response.json();
      setRetirementData(result);
    } else {
      console.error('计算失败');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <h1 className="text-2xl font-bold mb-4">法定退休年龄计算器</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">出生年月</label>
        <input
          type="month"
          id="birthDate"
          className="border border-gray-300 p-2 rounded w-full mb-4"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
        />

        <label className="block mb-2">人员类型</label>
        <select
          id="personType"
          className="border border-gray-300 p-2 rounded w-full mb-4"
          value={personType}
          onChange={(e) => setPersonType(e.target.value)}
        >
          <option value="male">男职工</option>
          <option value="female55">原法定退休年龄55周岁的女职工</option>
          <option value="female50">原法定退休年龄50周岁的女职工</option>
        </select>

        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}  {/* 显示错误信息 */}

        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          计算退休年龄
        </button>
      </form>

      <div id="result" className="mt-4">
        {retirementData && (
          <>
            <p>您的改革后法定退休年龄为：<strong>{retirementData.retirementAgeYears}岁 {retirementData.retirementAgeMonths}个月</strong></p>
            <p>您的改革后退休时间为：<strong>{retirementData.retirementDate}</strong></p>
            <p>您的延迟月数为：<strong>{retirementData.delayMonths}个月</strong></p>
            <p>您退休当年最低缴费年限为：<strong>{retirementData.minimumContributionYears}</strong></p>
            <p>您自愿提前退休的时间最早为：<strong>{retirementData.earlyRetirement}</strong></p>
            <p>您自愿延长退休的时间最晚为：<strong>{retirementData.lateRetirement}</strong></p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
