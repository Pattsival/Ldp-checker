import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Filter, X, FileText, TrendingUp, DollarSign, ChevronDown } from 'lucide-react';

// ===== ฟังก์ชันหลัก =====
const editDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

const getSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

const fuzzySearch = (text, search) => {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();
  if (textLower.includes(searchLower)) return true;
  let searchIndex = 0;
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) searchIndex++;
  }
  return searchIndex === searchLower.length;
};

const checkDuplicates = (project, projects, threshold = 0.7) => {
  return projects.filter(p => {
    if (p.id === project.id) return false;
    const nameSimilarity = getSimilarity(p.name, project.name);
    const objectiveSimilarity = getSimilarity(p.objective, project.objective);
    return nameSimilarity > threshold || objectiveSimilarity > threshold;
  });
};

const filterProjects = (projects, filters) => {
  return projects.filter(project => {
    if (filters.searchTerm) {
      const matchName = fuzzySearch(project.name, filters.searchTerm);
      const matchObjective = fuzzySearch(project.objective, filters.searchTerm);
      if (!matchName && !matchObjective) return false;
    }
    if (filters.strategy !== 'all' && project.strategy !== filters.strategy) return false;
    if (filters.year !== 'all' && project.fiscal !== filters.year) return false;
    if (filters.dept !== 'all' && project.dept !== filters.dept) return false;
    return true;
  });
};

const calculateBudgetStats = (projects, year) => {
  const total = projects.reduce((sum, p) => sum + (p.budget[year] || 0), 0);
  const avg = projects.length > 0 ? total / projects.length : 0;
  return { total, avg };
};

const calculateTotalBudget = (projects) => {
  const years = [2566, 2567, 2568, 2569, 2570];
  const budgetByYear = {};
  years.forEach(year => {
    budgetByYear[year] = projects.reduce((sum, p) => sum + (p.budget[year] || 0), 0);
  });
  return budgetByYear;
};

const getStrategies = (projects) => {
  const strategiesMap = new Map();
  projects.forEach(p => {
    if (!strategiesMap.has(p.strategy)) {
      strategiesMap.set(p.strategy, p.strategyName);
    }
  });
  return Array.from(strategiesMap.entries()).map(([code, name]) => ({ code, name }));
};

const getDepartments = (projects) => {
  const depts = new Set(projects.map(p => p.dept));
  return Array.from(depts).sort();
};

const getFiscalYears = (projects) => {
  const years = new Set();
  projects.forEach(p => {
    Object.keys(p.budget).forEach(year => {
      if (p.budget[year] > 0) years.add(year);
    });
  });
  return Array.from(years).sort((a, b) => a - b);
};

const findIncompleteProjects = (projects) => {
  return projects.filter(p => {
    const hasEmptyFields = !p.name || !p.objective || !p.target || !p.dept;
    const hasNoBudget = !p.budget || Object.values(p.budget).every(b => b === 0);
    const hasNoKPI = !p.kpi || p.kpi.trim() === '';
    return hasEmptyFields || hasNoBudget || hasNoKPI;
  });
};

// ===== Component =====
const LocalDevPlanChecker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // ข้อมูลโครงการ (ใส่ของคุณเองตรงนี้)
  const projects = [
{

id: 1,

name: 'กิจกรรมรณรงค์ 3Rs: Reduce Reuse Recycle',

strategy: 'ยุทธศาสตร์ที่ 1',

strategyName: 'สาธารณสุขและสิ่งแวดล้อม',

objective: 'เพื่อรณรงค์เสริมสร้างความรู้และตระหนักในการแก้ไขปัญหาเรื่องการจัดการขยะมูลฝอยโดยอาศัยหลัก 3Rs',

target: 'นักเรียน นักศึกษา หรือประชาชน',

budget: { 2566: 50000, 2567: 50000, 2568: 50000, 2569: 50000, 2570: 50000 },

kpi: 'ประชาชนมีความรู้ความเข้าใจเรื่องการจัดการขยะฯ ร้อยละ 70',

result: 'ประชาชนมีความรู้และตระหนักในการแก้ไขปัญหาขยะมูลฝอย',

dept: 'สำนักสาธารณสุขฯ งานบริการรักษาความสะอาด',

fiscal: '2566'

},

{

id: 2,

name: 'น้ำหมักจุลินทรีย์ชีวภาพ',

strategy: 'ยุทธศาสตร์ที่ 1',

strategyName: 'สาธารณสุขและสิ่งแวดล้อม',

objective: 'เพื่อนำน้ำหมักชีวภาพมาใช้ดับกลิ่นรถขยะหลังปฏิบัติงาน และลดปริมาณมูลฝอยจากเศษผักและผลไม้',

target: 'นักเรียน นักศึกษา หรือประชาชน',

budget: { 2566: 50000, 2567: 50000, 2568: 50000, 2569: 50000, 2570: 50000 },

kpi: 'สามารถให้ความรู้กับผู้ที่สนใจทำน้ำหมักชีวภาพได้ ร้อยละ 80',

result: 'ลดปริมาณขยะในการฝังกลบ และมีน้ำหมักชีวภาพเพื่อใช้งาน',

dept: 'สำนักสาธารณสุขฯ งานบริการรักษาความสะอาด',

fiscal: '2566'

},

{

id: 3,

name: 'ปุ๋ยหมักอินทรีย์',

strategy: 'ยุทธศาสตร์ที่ 1',

strategyName: 'สาธารณสุขและสิ่งแวดล้อม',

objective: 'เพื่อเป็นการลดปริมาณมูลฝอยในการฝังกลบ และนำปุ๋ยที่ได้ไปใช้ประโยชน์',

target: 'นักเรียน นักศึกษา หรือประชาชน',

budget: { 2566: 50000, 2567: 50000, 2568: 50000, 2569: 50000, 2570: 50000 },

kpi: 'สามารถให้ความรู้กับผู้ที่สนใจทำปุ๋ยหมักอินทรีย์ ร้อยละ 80',

result: 'ลดปริมาณมูลฝอย และมีปุ๋ยอินทรีย์ใช้ภายในเขตเทศบาล',

dept: 'สำนักสาธารณสุขฯ งานบริการรักษาความสะอาด',

fiscal: '2566'

},

{

id: 4,

name: 'วันอาสาสมัครสาธารณสุขแห่งชาติ',

strategy: 'ยุทธศาสตร์ที่ 1',

strategyName: 'สาธารณสุขและสิ่งแวดล้อม',

objective: 'เพื่อพัฒนาศักยภาพ อสม. ให้มีความรู้ มีทักษะในการดำเนินงานแก้ไขปัญหาสุขภาพในชุมชน',

target: 'อสม. จำนวน 725 คน',

budget: { 2566: 250000, 2567: 250000, 2568: 250000, 2569: 321200, 2570: 321200 },

kpi: 'อสม. มีความรู้ในการดูแลประชาชนเพิ่มขึ้นร้อยละ 80',

result: 'อสม. มีความรู้และทักษะในการดูแลสุขภาพประชาชน',

dept: 'สำนักสาธารณสุขฯ กลุ่มงานส่งเสริมสุขภาพ',

fiscal: '2566'

},

{

id: 5,

name: 'อบรมอาสาสมัครสาธารณสุข (อสม.ใหม่)',

strategy: 'ยุทธศาสตร์ที่ 1',

strategyName: 'สาธารณสุขและสิ่งแวดล้อม',

objective: 'เพื่อให้ อสม. มีความรู้ มีทักษะและความสามารถในการดำเนินงานสุขภาพภาคประชาชน',

target: 'อสม. จำนวน 120 คน',

budget: { 2566: 82000, 2567: 82000, 2568: 82000, 2569: 120000, 2570: 120000 },

kpi: 'อสม. มีความรู้ในการดูแลสุขภาพประชาชนเพิ่มขึ้นร้อยละ 80',

result: 'อสม. มีทักษะในการดูแลสุขภาพและมีทัศนคติที่ดี',

dept: 'สำนักสาธารณสุขฯ กลุ่มงานส่งเสริมสุขภาพ',

fiscal: '2566'

},





// ยุทธศาสตร์ที่ 2 - การศึกษา ศาสนา วัฒนธรรม

{

id: 11,

name: 'สนับสนุนอาหารเสริม (นม)',

strategy: 'ยุทธศาสตร์ที่ 2',

strategyName: 'การศึกษา ศาสนา วัฒนธรรม',

objective: 'เพื่อให้นักเรียนได้รับอาหารเสริม(นม)ที่มีคุณภาพและเพียงพอ เพื่อพัฒนาการเจริญเติบโตและสร้างทางด้านการศึกษา',

target: '1. ศพด. ในสังกัด เทศบาล 12 แห่ง\n2. โรงเรียนสังกัดเทศบาล 9 แห่ง\n3. โรงเรียนสังกัดสพฐ. 2 แห่ง',

budget: { 2566: 852800, 2567: 852800, 2568: 852800, 2569: 852800, 2570: 852800 },

kpi: 'นักเรียนมีสุขภาพแข็งแรง อาหารเสริม(นม) 2',

result: 'นักเรียนมีสุขภาพแข็งแรงและมีพัฒนาการเติบโตที่ดี',

dept: 'สำนักการศึกษา',

fiscal: '2566'

},

{

id: 12,

name: 'ศูนย์การศึกษาพิเศษ หน่วยส่งเสริมประจำจังหวัดนครสวรรค์ สังกัด',

strategy: 'ยุทธศาสตร์ที่ 2',

strategyName: 'การศึกษา ศาสนา วัฒนธรรม',

objective: 'เพื่อสนับสนุนงบประมาณการจัดการเรียนการสอนสำหรับเด็กพิเศษ',

target: 'ศูนย์การศึกษาพิเศษ หน่วยส่งเสริมฯ',

budget: { 2566: 8509900, 2567: 8509900, 2568: 8509900, 2569: 8509900, 2570: 8509900 },

kpi: '',

result: 'เด็กพิเศษได้รับการพัฒนาทักษะและคุณภาพชีวิต',

dept: 'สำนักการศึกษา',

fiscal: '2566'

},



// ยุทธศาสตร์ที่ 3 - สวัสดิการสังคม

{

id: 13,

name: 'ส่งเสริมสนับสนุนการพัฒนาชุมชน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อเสริมแรงชุมชน เด็ก เยาวชน และประชาชนให้มีคุณภาพชีวิตที่ดี พัฒนาชุมชนและองค์กรมวลชนทุกช่วงอายุ',

target: 'ชุมชน เด็ก เยาวชน และประชาชน',

budget: { 2566: 400000, 2567: 400000, 2568: 400000, 2569: 400000, 2570: 400000 },

kpi: 'คณะกรรมการชุมชนและประชาชนในชุมชน มีอำนาจในการปฏิบัติได้',

result: 'ชุมชนมีความเข้มแข็ง ประชาชนมีคุณภาพชีวิตที่ดีขึ้น',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},



// ยุทธศาสตร์ที่ 4 - พัฒนากายภาพเมือง

{

id: 14,

name: 'ปรับปรุงสถานที่ทิ้งขยะมูลฝอย',

strategy: 'ยุทธศาสตร์ที่ 4',

strategyName: 'พัฒนากายภาพเมือง',

objective: 'เพื่อสร้างความเชื่อมั่นเศรษฐกิจ ฐานโดยปรับปรุงโครงสร้างพื้นฐานให้ได้มาตรฐาน',

target: 'งานติดตั้งเครื่องบดกิ่งไม้ Mobile (Hybrid Aerator) งานติดตั้งระบบควบคุมการปนมัก',

budget: { 2566: 25000000, 2567: 0, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'ดำเนินการปนเสร็จสิ้นลงในการเสิร์จ ลดกลิ่น รายงาน',

result: 'สถานที่ทิ้งขยะได้มาตรฐาน ลดผลกระทบต่อสิ่งแวดล้อม',

dept: 'สำนักช่าง',

fiscal: '2566'

},



// ยุทธศาสตร์ที่ 5 - ความมั่นคง

{

id: 15,

name: 'ติดตั้งกล้อง CCTV พร้อมศูนย์ควบคุม',

strategy: 'ยุทธศาสตร์ที่ 5',

strategyName: 'การรักษาความสงบเรียบร้อยและความมั่นคง',

objective: 'เพื่อเช่าระบึงตรว่าโนยกภไนไพชะเพื่อความป่อดภัยในชีวิตและทรัพย์สินฝุระชาช วเมืองนครสวรรค์ ระ~มเฮทิทภระ',

target: 'จีตงปิฮกล้องและดับตจัุงนียมไฮท่งมล้องดั่วรทองในเมืองนครสวรรค์ 32 กล้อง',

budget: { 2566: 4000000, 2567: 4000000, 2568: 4000000, 2569: 4000000, 2570: 4000000 },

kpi: 'ประชาชนมีความมั่นใจในระบบรักษาความปลอดภัยและเกิดความปลอดภัยขึ้น',

result: 'ประชาชนมีความปลอดภัยในชีวิตและทรัพย์สิน',

dept: 'กองสวัสดิการสังคมและงประจำคนใพเไทยโซดีรสนมสภาพ',

fiscal: '2568'

},



// ยุทธศาสตร์ที่ 6 - การบริหารจัดการที่ดี

{

id: 16,

name: 'สร้างจิตสำนึกและความตระหนักในการป้องกันการทุจริต',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อสร้างจิตสำนึกและความตระหนักแก่พนักงานเทศบาล พนักงานจ้างทุกกลุกศทองและประชาชนในเขตเทศบาล จำนวน 50 คน',

target: 'พนักงานเทศบาล พนักงานจ้างทุกท่าน และประชาชนในเขตเทศบาล',

budget: { 2566: 20000, 2567: 20000, 2568: 20000, 2569: 20000, 2570: 20000 },

kpi: 'ผู้เข้ารับการอบรมจำนวน 50 คน',

result: 'เกิดการเสริมสร้างค่านิยมต่อต้านการทุจริต',

dept: 'สำนักปลัดเทศบาล กองนิติกรรมสัญญา',

fiscal: '2566'

},{

id: 17,

name: 'สงเสริมสนับสนุนกิจกรรมเศรษฐกิจพอเพียงภูมิปัญญาทองถิ่นแหลงเรียนรู และศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อนอมนำหลักปรัชญาเศรษฐกิจพัฒนาตนเองและใชเปนแนวทางในการพัฒนาชุมชน',

target: 'คณะกรรมการชุมชน เด็ก เยาวชน และประชาชนในเขตเทศบาลนครนครสวรรค จำนวน 200 คน',

budget: { 2566: 400000, 2567: 400000, 2568: 400000, 2569: 400000, 2570: 400000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'คณะกรรมการชุมชนและประชาชนในชุมชนมีความรูความเขาใจหลักปรัชญาเศรษฐกิจพอเพียง',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 18,

name: 'สงเสริม สนับสนุน หนึ่งชุมชน หนึ่งผลิตภัณฑ และออกแบบบรรจุภัณฑ',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริมภูมิปญญาทองถิ่นสงเสริมความคิดริเริ่มสรางสรรคของชุมชนในการพัฒนาผลิตภัณฑ',

target: 'กลุมผูผลิตสินคา OTOP กลุมผูจำหนายสินคา OTOP จำนวน 80 ราย และประชาชนทั่วไป จำนวน 1000 คน',

budget: { 2566: 2000000, 2567: 2000000, 2568: 2000000, 2569: 2000000, 2570: 2000000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'สงเสริมภูมิปญญาทองถิ่น ประชาชนมีชองทางการเลือกสินคาในราคายุติธรรม',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 19,

name: 'สงเสริม สนับสนุนกิจกรรมวันพอ วันแม แหงชาติ',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อเปนการแสดงออกถึงความจงรักภักดีตอสถาบันพระมหากษัตริย',

target: 'ประชาชนในเขตเทศบาลนครนครสวรรค จำนวน 500 คน',

budget: { 2566: 500000, 2567: 500000, 2568: 500000, 2569: 500000, 2570: 500000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ประชาชนไดแสดงออกถึงความจงรักภักดีตอสถาบันพระมหากษัตริย',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 20,

name: 'สงเสริมการแสดงออกถึงความจงรักภักดีตอชาติ ศาสนา พระมหากษัตริย และศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อเปนการแสดงออกถึงความจงรักภักดีและเทิดทูนตอสถาบันชาติ ศาสนาและพระมหากษัตริย',

target: 'ประชาชนในชุมชนเขตเทศบาลนครนครสวรรค จำนวน 1000 คน',

budget: { 2566: 500000, 2567: 500000, 2568: 500000, 2569: 500000, 2570: 500000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ประชาชนไดแสดงออกถึงความจงรักภักดีและเทิดทูนตอสถาบันชาติ ศาสนา และพระมหากษัตริย',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 21,

name: 'อบรม สงเสริม คุณธรรม จริยธรรม ศีลธรรม สำหรับประชาชนในเขตเทศบาลฯและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อใหประชาชนทั่วไป ผูสูงอายุและผูดอยโอกาสไดฝกปฏิบัติธรรม การภาวนาจิต',

target: 'ประชาชนทั่วไป ผูสูงอายุ และผูดอยโอกาส ในเขตเทศบาลนครนครสวรรค จำนวน 100 คน',

budget: { 2566: 300000, 2567: 300000, 2568: 300000, 2569: 300000, 2570: 300000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ประชาชนไดฝกปฏิบัติธรรม ไดรับความสงบสุขของชีวิต',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 22,

name: 'สงเสริมพัฒนาเพิ่มศักยภาพและอบรมสัมมนาของคณะกรรมการชุมชน คณะทำงานดานตางๆในชุมชนและประชาชนในเขตเทศบาลนครนครสวรรคและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อดำเนินการตามอำนาจหนาที่ตามบทบาทภารกิจ ในดานการสงเสริมการมีสวนรวมของราษฎร',

target: 'กรรมการชุมชน คณะทำงานดานตางๆในชุมชน และประชาชนในเขตเทศบาลนครนครสวรรค จำนวน 1200 คน',

budget: { 2566: 1000000, 2567: 8000000, 2568: 8000000, 2569: 8000000, 2570: 8000000 },

kpi: 'จำนวนผูเขารวมโครงการไมนอยกวารอยละ 80',

result: 'คณะกรรมการชุมชนมีความรูความสามารถ มีการเรียนรูรวมกัน',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 23,

name: 'พัฒนาศักยภาพคณะกรรมการและสมาชิกกองทุนสวัสดิการชุมชนเมืองเทศบาลนครนครสวรรคและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสนับสนุนใหชุมชนมีระบบและกองทุนสวัสดิการพื้นฐานในการดูแลชวยเหลือเกื้อกูลซึ่งกันและกัน',

target: 'คณะกรรมการและสมาชิกกองทุนสวัสดิการชุมชนเมืองเทศบาลนครนครสวรรค',

budget: { 2566: 500000, 2567: 800000, 2568: 800000, 2569: 800000, 2570: 800000 },

kpi: 'จำนวนคณะกรรมการและสมาชิกกองทุนสวัสดิการชุมชนที่เขารวมโครงการฯ',

result: 'ชุมชนมีระบบสวัสดิการที่สามารถดูแลคนในชุมชนทุกชวงวัย',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 24,

name: 'สงเสริมอบรมคณะกรรมการกองทุนชุมชนเมือง สมาชิกกองทุนและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อเปนการสงเสริมและพัฒนาแลกเปลี่ยนทัศนคติประสบการณทำงาน',

target: 'จัดอบรมสัมมนาและศึกษาดูงาน อยางนอยปละ 1 ครั้ง',

budget: { 2566: 200000, 2567: 200000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'พัฒนาแลกเปลี่ยนทัศนคติประสบการณการทำงาน',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 25,

name: 'สนับสนุนการจัดประชุมประชาคมคณะกรรมการจัดทำแผนพัฒนาชุมชนและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อใหคณะกรรมการ สมาชิกและประชาชนในชุมชนจัดทำแผนชุมชนไดรูหลักการประชุมประชาคม',

target: 'คณะกรรมการชุมชน อนุกรรมการ ที่ปรึกษา และสมาชิกชุมชน 71 ชุมชน',

budget: { 2566: 1000000, 2567: 1000000, 2568: 1000000, 2569: 1000000, 2570: 1000000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'คณะกรรมการ สมาชิก และประชาชนทุกฝายสามารถวิเคราะหปญหา สาเหตุ และแนวทางในการแกไข',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 26,

name: 'สงเสริมและพัฒนาศักยภาพคณะกรรมการอาสาพัฒนาสตรี และสมาชิกอาสาพัฒนาสตรีเทศบาลนครนครสวรรคและศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริมความรูและเพิ่มพูนทักษะการพัฒนาบทบาทสตรี',

target: 'คณะกรรมการอาสาพัฒนาสตรี และสมาชิกอาสาพัฒนาสตรี เทศบาลนครนครสวรรค จำนวน 73 ชุมชน',

budget: { 2566: 1000000, 2567: 4000000, 2568: 4000000, 2569: 4000000, 2570: 4000000 },

kpi: 'จำนวนคณะกรรมการอาสาพัฒนาสตรีและสมาชิกอาสาพัฒนาสตรีที่เขารวมโครงการฯ ไมนอยกวารอยละ 80',

result: 'คณะกรรมการอาสาพัฒนาสตรีมีความรูความเขาใจในบทบาทหนาที่ของตนเอง',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 27,

name: 'คัดเลือกสตรีดีเดนในเขตเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อคัดเลือกสตรีดีเดนสาขาดานตางๆ เปนแบบอยางในการดำเนินงานพัฒนาสตรี/ชุมชน',

target: 'สตรีในชุมชน จำนวน 73 ชุมชน',

budget: { 2566: 100000, 2567: 100000, 2568: 100000, 2569: 100000, 2570: 100000 },

kpi: 'จำนวนชุมชนที่เขารวมโครงการ',

result: 'เทศบาลฯไดผูนําสตรีดานการพัฒนาสาขาตางๆ เปนแบบอยาง',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 28,

name: 'อบรม สงเสริม สนับสนุนกิจกรรมศูนยพัฒนาครอบครัวชุมชนในเขตเทศบาลนครนครสวรรค และศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อการยกยองเชิดชูบุคคลที่มีความกตัญู และครอบครัวที่ประสบความสำเร็จ',

target: 'คณะทำงานศูนยพัฒนาครอบครัวชุมชน สมาชิกครอบครัว พอ แม ลูก และประชาชนในชุมชน จำนวน 250 คน',

budget: { 2566: 500000, 2567: 500000, 2568: 500000, 2569: 500000, 2570: 500000 },

kpi: 'คณะทำงานศูนยพัฒนาครอบครัวชุมชน สมาชิกครอบครัว ครบทั้ง 65 ชุมชน',

result: 'เด็ก เยาวชน ประชาชน คณะกรรมการชุมชนไดรับการเชิดชูเกียรติ',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 29,

name: 'สนับสนุนกลุมสตรีเพื่อสงเสริมและพัฒนาศักยภาพกลุมสตรี',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริมใหสตรีและประชาชนในชุมชนเขาใจบทบาทและหนาที่ของตนเอง',

target: 'ชุมชนในเขตเทศบาลนครนครสวรรค จำนวน 71 ชุมชน',

budget: { 2566: 710000, 2567: 710000, 2568: 710000, 2569: 710000, 2570: 710000 },

kpi: 'จำนวนชุมชนที่เขารวมโครงการ',

result: 'สตรีและประชาชนในชุมชนมีความรูความเขาใจเกี่ยวกับการพัฒนาชุมชน',

dept: 'กองสวัสดิการสังคม (เงินอุดหนุน)',

fiscal: '2566'

},

{

id: 30,

name: 'รณรงคยุติความรุนแรงตอเด็ก สตรี คนชรา และครอบครัว',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริม สนับสนุนใหประชาชน ครอบครัว ชุมชน มีสวนรวมชวยดูแล เฝาระวัง ปองกัน',

target: 'ผูนำชุมชน ผูนำสตรี อาสาพัฒนาสตรี เด็ก เยาวชน และประชาชนในชุมชนเขตเทศบาลนครนครสวรรค จำนวน 200 คน',

budget: { 2566: 300000, 2567: 300000, 2568: 300000, 2569: 300000, 2570: 300000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ประชาชน ครอบครัว ชุมชนมีสวนรวมชวยดูแล เฝาระวัง ปองกันและแกไขปญหาความรุนแรง',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 31,

name: 'ประกวดชุมชนพัฒนาดีเดนและคัดเลือกกรรมการตัวอยาง',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อเปนการยกยองเชิดชูเกียรติคณะกรรมการชุมชนที่เปนคนดีเปนแบบอยางที่ดี',

target: 'ชุมชนที่ไดรับการคัดเลือก จำนวน 10 ชุมชน กรรมการชุมชน จำนวน 200 คน',

budget: { 2566: 200000, 2567: 200000, 2568: 200000, 2569: 200000, 2570: 200000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ชุมชนและคณะกรรมการชุมชนมีความตื่นตัว ตระหนักถึงบทบาทหนาที่',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 32,

name: 'สงเสริม อบรม ความรูเกี่ยวกับการพิทักษความเสมอภาคและคุมครองสิทธิสตรีและครอบครัว และศึกษาดูงาน',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริมและสนับสนุนใหสตรีมีสวนรวมในกิจกรรมทุกดาน ทุกๆระดับในสังคม',

target: 'ประชาชนในเขตเทศบาลนครนครสวรรค สตรีในชุมชนครอบครัว ผูนำกลุมตางๆ จำนวน 100 คน',

budget: { 2566: 200000, 2567: 200000, 2568: 200000, 2569: 200000, 2570: 200000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'สตรีมีสวนรวมในกิจกรรมทุกดาน เสริมสรางเจตคติและการยอมรับความเสมอภาค',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 33,

name: 'สงเสริม สนับสนุนการดำเนินกิจการหอพักเอกชน ภายในเขตเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อสงเสริม สนับสนุน และสรางความรูความเขาใจใหกับผูประกอบกิจการหอพัก',

target: 'ผูประกอบการหอพัก ผูจัดการหอพัก จำนวน 86 คน',

budget: { 2566: 300000, 2567: 300000, 2568: 300000, 2569: 300000, 2570: 300000 },

kpi: 'จำนวนประชาชนที่เขารวมโครงการ',

result: 'ผูประกอบกิจการหอพักเกิดความรูความเขาใจเกี่ยวกับพระราชบัญญัติหอพัก',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 34,

name: 'ประชุมคณะกรรมการอาสาพัฒนาสตรีเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 3',

strategyName: 'สวัสดิการสังคมและชุมชน',

objective: 'เพื่อใหคณะผูบริหารเทศบาลฯ หัวหนาสวนราชการ ไดแจงขอมูลขาวสารของทางราชการ',

target: 'คณะกรรมการอาสาพัฒนาสตรีเทศบาลนครนครสวรรค และองคกรสตรี เดือนละ 1 ครั้ง รวม 12 เดือน',

budget: { 2566: 100000, 2567: 100000, 2568: 100000, 2569: 100000, 2570: 100000 },

kpi: 'จำนวนคณะกรรมการอาสาพัฒนาสตรีและองคกรสตรีที่เขารวมประชุม ไมนอยกวารอยละ 80',

result: 'เทศบาลฯไดแจงขอมูลขาวสารใหคณะกรรมการอาสาพัฒนาสตรีไดรับทราบทันตอสถานการณ',

dept: 'กองสวัสดิการสังคม',

fiscal: '2566'

},

{

id: 35,

name: 'สรางจิตสำนึกและความตระหนักแกประชาชนในการปองกันการทุจริต',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อสรางจิตสำนึกและความตระหนักแกพนักงานเทศบาล พนักงานจางและประชาชนในการปองกันการทุจริต',

target: 'พนักงานเทศบาล พนักงานจางทุกสำนัก ทุกกอง และประชาชน ในเขตเทศบาล จำนวน 50 คน',

budget: { 2566: 20000, 2567: 20000, 2568: 20000, 2569: 20000, 2570: 20000 },

kpi: 'ผูเขารับการอบรมจำนวน 50 คน',

result: 'เกิดการเสริมสรางคานิยมตอตานการทุจริตใหกับพนักงานเทศบาล พนักงานจางและประชาชน',

dept: 'สำนักปลัดเทศบาล งานนิติกรรมสัญญา',

fiscal: '2566'

},

{

id: 36,

name: 'ปรับปรุงฝาเพดานหองประชุมชั้น 5 (ภาพจิตรกรรม)',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อปรับปรุงฝาเพดานใหมีความสวยงาม',

target: 'ปรับปรุงฝาเพดานหองประชุมชั้น 5 จำนวน 1 งาน ตามแบบแปลนรายละเอียดของเทศบาล',

budget: { 2566: 0, 2567: 2000000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'การปรับปรุงฝาเพดานหองประชุมชั้น 5',

result: 'หองประชุมมีรูปแบบและลวดลายสวยงามอยูในสภาพพรอมใชงานอยางมีประสิทธิภาพ',

dept: 'สำนักปลัดเทศบาล',

fiscal: '2567'

},

{

id: 37,

name: 'NKS SMART CITY Application',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดหา Application กลางของเทศบาลที่รองรับงานบริการประชาชนและอำนวยความสะดวกในการติดตอราชการ Online',

target: 'ระบบใหบริการบน web และ Application ที่ทันสมัย สะดวก เขาถึงไดงาย จำนวนไมนอยกวา 5 ระบบ',

budget: { 2566: 0, 2567: 5300000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบใหบริการบน web และ Application',

result: 'เทศบาลมีระบบใหบริการที่ทันสมัย สะดวก สามารถลดขั้นตอนและเวลาในการติดตอราชการของประชาชนได',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 38,

name: 'จัดหาและติดตั้งระบบเครือขายสัญญาณไรสายสำหรับระบบ IoT',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดหาระบบสื่อสารที่ใชพลังงานต่ำและมีความหลากหลายในการใชงานระบบงานตรวจวัดผาน Sensor',

target: 'จัดหาอุปกรณ LoRa Gateway ไมนอยกวา 20 จุด อุปกรณตรวจวัดคุณภาพอากาศ 30 จุด อุปกรณตรวจวัดระดับน้ำ 6 จุด',

budget: { 2566: 2000000, 2567: 450000, 2568: 450000, 2569: 450000, 2570: 450000 },

kpi: 'จำนวน Node LoRa Gateway, Sensor Node และความหลากหลายในการนำไปใชประโยชนดานตาง ๆ',

result: 'เทศบาลมีระบบเครือขาย IoT ไรสายและเครื่องมือสำหรับการสำรวจ ตรวจและวิเคราะหทางดานสิ่งแวดลอม',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2566'

},

{

id: 39,

name: 'ปรับปรุงหองปฏิบัติการ Smart City',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อรองรับการขยายงานของศูนยเทคโนโลยีสารสนเทศ ดาน Smart City และระบบงานทางดานเทคโนโลยี',

target: 'ปรับปรุงหองปฏิบัติการ Smart City หองศูนยขอมูลกลางและศูนยพัฒนาบุคลากรดานเทคโนโลยี',

budget: { 2566: 0, 2567: 6500000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบควบคุมสั่งการและขนาดหองฝกอบรม',

result: 'สามารถรองรับการบริหารจัดการระบบเทคโนโลยี Smart City และเปนศูนยพัฒนาบุคลากรไดอยางมีประสิทธิภาพ',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 40,

name: 'พัฒนาระบบตรวจวัดคาสิ่งแวดลอม และระบบ Sensor บนโครงขาย IOT',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อพัฒนาระบบ Sensor บนระบบ IOT พรอมระบบแสดงผลวิเคราะหขอมูลสำหรับตรวจวัดคาทางดานสิ่งแวดลอม',

target: 'จัดหาอุปกรณ วัสดุ สำหรับพัฒนาระบบ Sensor ทางดานสิ่งแวดลอม ระบบรับสงสัญญาณ ระบบจัดเก็บและประมวลผล',

budget: { 2566: 150000, 2567: 50000, 2568: 50000, 2569: 50000, 2570: 50000 },

kpi: 'จำนวนระบบตรวจวัดที่พัฒนาขึ้น',

result: 'เทศบาลมีระบบตรวจวัดคาสิ่งแวดลอมที่พัฒนาขึ้นเอง พรอมสำหรับนำไปใชงานและประเมินความเสี่ยง',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2566'

},

{

id: 41,

name: 'NSM Smart Application',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่ออำนวยความสะดวกในการใหบริการกับประชาชนทั่วไป นักทองเที่ยว ผูเกี่ยวของในการเขาถึงขอมูล',

target: 'จัดทำ Application เทศบาล พรอมระบบบริหารจัดการขอมูล จำนวน 1 ระบบ',

budget: { 2566: 0, 2567: 5500000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'รอยละ 80 ของประชาชนทั่วไปสามารถเขาถึงขอมูลและบริการออนไลนของเทศบาลได',

result: 'ประชาชนทั่วไป ผูเกี่ยวของและนักทองเที่ยวไดรับความสะดวกในการเขาถึงบริการออนไลนไดตลอดเวลา',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 42,

name: 'NSM Smart Health',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่ออำนวยความสะดวกและอำนวยความพรอมสำหรับใหบริการทางดานสาธารณสุข',

target: 'จัดทำ Application NSM Smart Health พรอมงานบริหารจัดการขอมูล ติดตามและเฝาระวัง จำนวน 1 ระบบ',

budget: { 2566: 0, 2567: 4500000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'รอยละ 80 ของผูปวยและกลุมเปราะบางสามารถไดรับการดูแลทางดานสาธารณสุขขั้นพื้นฐานไดอยางรวดเร็ว',

result: 'มีระบบสำหรับใหบริการและใหความสะดวกตอทั้งเจาหนาที่ ผูปวย และกลุมเปราะบาง',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 43,

name: 'ปรับปรุงระบบหอกระจายเสียงไรสาย',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อปรับปรุงระบบกระจายเสียงไรสายเดิมของเทศบาลใหสามารถใชงานไดตามความถี่ที่ กสทช. กำหนด',

target: 'ปรับเปลี่ยนความถี่ใชงานของอุปกรณกระจายเสียงไรสาย ภาคสง 1 ชุด ภาครับ 129 จุด',

budget: { 2566: 0, 2567: 1000000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนอุปกรณที่ดำเนินการเปลี่ยนแปลงความถี่ใชงาน',

result: 'มีระบบสำหรับใหบริการการกระจายเสียงไรสายใหบริการไดอยางถูกตองตามกฏหมาย',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 44,

name: 'ระบบภูมิสารสนเทศ (GIS) ระบบระบายน้ำในเขตเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดทำระบบสนับสนุนการตัดสินใจในรูปขอมูลเชิงภูมิศาสตรของระบบระบายน้ำในเขตเทศบาล',

target: 'จัดหาฮารดแวร ซอรฟแวร และพัฒนาระบบภูมิสารสนเทศของระบบระบายน้ำในรูปแบบขอมูลเชิงภูมิศาสตร',

budget: { 2566: 30000000, 2567: 0, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนขอมูลเชิงภูมิศาสตรและขอมูลระบายน้ำในเขตเทศบาลไมนอยกวารอยละ 80',

result: 'ประชาชนไดรับการแกไขปญหาน้ำรอการระบายไดอยางเปนระบบโดยมีระบบสนับสนุนการวางแผนที่ถูกตอง',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ / สำนักชาง',

fiscal: '2566'

},

{

id: 45,

name: 'ติดตั้งระบบตรวจจับการฝาฝนกฎจราจรเพื่อลดอุบัติเหตุบนทองถนน (รหัสโครงการ IG-66-0033)',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อพัฒนาโครงสรางพื้นฐานดานการพัฒนานวัตกรรมเพื่อนำเทคโนโลยีดิจิทัลมาใชในการบริหารจัดการและแกไขปญหาจราจร',

target: 'พัฒนาโครงสรางพื้นฐานดานการพัฒนานวัตกรรมเทคโนโลยีดิจิทัลดวยระบบ AI จำนวน 1 ระบบ',

budget: { 2566: 850000, 2567: 0, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบที่พัฒนา',

result: 'สามารถเก็บขอมูลเพื่อใชประกอบการตัดสินในทางดานจราจรและนำไปบูรณาการในการปองกันปราบปรามอาชญากรรม',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ / สำนักชาง',

fiscal: '2566'

},

{

id: 46,

name: 'จางออกแบบงานระบบภายในอาคารสำนักงานเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดจางผูใหบริการออกแบบที่มีความชำนาญและมีคุณสมบัติเหมาะสมในการออกแบบงานระบบภายในอาคาร',

target: 'แบบรูปรายการงานกอสรางพรอมเอกสารในการจัดจางกอสรางงานระบบภายในอาคารสำนักงานเทศบาล',

budget: { 2566: 0, 2567: 1000000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'เอกสารแบบแปลนกอสรางงานระบบภายในอาคาร เชน ระบบไฟฟา ระบบประปา ระบบสุขาภิบาล ระบบสื่อสาร',

result: 'ระบบภายในอาคารสำนักงานเทศบาลมีความปลอดภัยและประสิทธิภาพสูงสุด',

dept: 'สำนักปลัดเทศบาล',

fiscal: '2567'

},

{

id: 47,

name: 'จัดหาระบบคุมครองขอมูลสวนบุคล (PDPA)',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดหาระบบคุมครองขอมูลสวนบุคคลใหสามารถปฏิบัติงานไดอยางถูกตองตาม พ.ร.บ. คุมครองขอมูลสวนบุคคล',

target: 'จัดหาระบบคุมครองขอมูลสวนบุคคลและเตรียมความพรอมใหกับบุคลากร ตาม PDPA จำนวน 1 ระบบ',

budget: { 2566: 0, 2567: 1000000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบที่จัดหาและจำนวนบุคลากรที่ใชงานระบบ',

result: 'มีระบบคุมครองขอมูลสวนบุคคล บุคลากรมีความพรอมในการปฏิบัติหนาที่ใหเปนไปตาม PDPA',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 48,

name: 'จัดหาระบบ cyber security ของเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อจัดหาระบบปองกันภัยทาง cyber สำหรับการปองกันการถูกโจมตีและการเขาถึงขอมูล',

target: 'จัดหาระบบปองกันภัยทาง cyber จำนวน 1 ระบบ ฝกอบรมและใหความรูดานความปลอดภัยทาง cyber',

budget: { 2566: 0, 2567: 1500000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบที่จัดหาและจำนวนบุคลากรที่เกี่ยวของกับความปลอดภัยทาง cyber',

result: 'มีระบบรักษาความปลอดภัยทาง cyber ที่มีประสิทธิภาพ สามารถปองกันการถูกโจมตีไดกอนที่จะไดรับความเสียหาย',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 49,

name: 'จัดทำ Interactive website ของเทศบาลนครนครสวรรค',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อพัฒนาระบบ Interactive website ที่มีความสามารถในการโตตอบกับผูใช',

target: 'พัฒนาระบบเชิงโตตอบ website ที่มีความยืดหยุนในการเชื่อมตอขอมูลกับระบบตาง ๆ จำนวน 1 ระบบ',

budget: { 2566: 0, 2567: 500000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบที่พัฒนาสามารถเชื่อมโยงและเขาถึงบริการได',

result: 'มีระบบ Interactive website ที่มีความสามารถและยืดหยุนในการปรับแตงเพิ่มและลดการเชื่อมโยงขอมูลไดอยางมีประสิทธิภาพ',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 50,

name: 'ติดตั้งระบบตรวจจับการฝาฝนกฎจราจรเพื่อลดอุบัติเหตุบนทองถนน (รหัสโครงการ IG-66-0033) ภายใตมาตรการชวยเหลือหรือการอุดหนุน',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อพัฒนาโครงสรางพื้นฐานดานการพัฒนานวัตกรรมเพื่อนำเทคโนโลยีดิจิทัลมาใชในการบริหารจัดการและแกไขปญหาจราจร',

target: 'พัฒนาโครงสรางพื้นฐานดานนวัตกรรมเทคโนโลยีดิจิทัลดวยระบบ AI จำนวน 1 ระบบ (เงินสนับสนุนจาก depa 4,998,980 บาท และเงินสมทบเทศบาล 799,020 บาท)',

budget: { 2566: 0, 2567: 5798000, 2568: 0, 2569: 0, 2570: 0 },

kpi: 'จำนวนระบบที่พัฒนา',

result: 'สามารถเก็บขอมูลเพื่อใชประกอบการตัดสินในทางดานจราจรและนำไปบูรณาการในการปองกันปราบปรามอาชญากรรม',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

},

{

id: 51,

name: 'โครงการจัดหาเครื่องกระจายเสียงไรสายโดยใชระบบอินเตอรเน็ต',

strategy: 'ยุทธศาสตร์ที่ 6',

strategyName: 'การบริหารจัดการที่ดี',

objective: 'เพื่อเพิ่มชองทางใหประชาชนสามารถรับรูขาวสาร ประกาศสำคัญ แจงเหตุฉุกเฉินไดอยางรวดเร็ว',

target: 'จัดหาพรอมติดตั้งเครื่องกระจายเสียงไรสาย ระบบอินเตอรเน็ต จำนวน 155 ชุด เพื่อทดแทนระบบ Analog เดิม',

budget: { 2566: 0, 2567: 3875000, 2568: 3875000, 2569: 0, 2570: 0 },

kpi: 'จำนวนจุดติดตั้งและอุปกรณ',

result: 'มีระบบสำหรับใหบริการการกระจายเสียงไรสายไดอยางถูกตองตามกฎหมาย',

dept: 'กองยุทธศาสตรและงบประมาณ กลุมงานเทคโนโลยีสารสนเทศ',

fiscal: '2567'

}

];
  // คำนวนข้อมูล
  const strategies = useMemo(() => getStrategies(projects), [projects]);
  const departments = useMemo(() => getDepartments(projects), [projects]);
  const fiscalYears = useMemo(() => getFiscalYears(projects), [projects]);

  const filteredProjects = useMemo(() => {
    return filterProjects(projects, {
      searchTerm: searchTerm,
      strategy: selectedStrategy,
      year: selectedYear,
      dept: selectedDept
    });
  }, [searchTerm, selectedStrategy, selectedYear, selectedDept, projects]);

  const duplicatesWarning = useMemo(() => {
    if (!selectedProject) return [];
    const project = projects.find(p => p.id === selectedProject);
    return project ? checkDuplicates(project, projects, 0.7) : [];
  }, [selectedProject, projects]);

  const incompleteProjects = useMemo(() => {
    return findIncompleteProjects(filteredProjects);
  }, [filteredProjects]);

  const budgetStats = useMemo(() => {
    return calculateTotalBudget(filteredProjects);
  }, [filteredProjects]);

  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const strategies = new Set(filteredProjects.map(p => p.strategy)).size;
    const totalBudget = Object.values(budgetStats).reduce((a, b) => a + b, 0);
    return { total, strategies, totalBudget };
  }, [filteredProjects, budgetStats]);

  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStrategy('all');
    setSelectedYear('all');
    setSelectedDept('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-lg shadow-2xl p-8 mb-8 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <FileText className="text-white" size={32} />
                </div>
                ตรวจสอบแผนพัฒนาท้องถิ่น
              </h1>
              <p className="text-blue-100 text-lg">เทศบาลนครสวรรค์ | ระบบจัดการและติดตามโครงการพัฒนาท้องถิ่น</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm font-semibold">ปีงบประมาณ 2566-2570</p>
              <p className="text-yellow-300 text-xs mt-1">ระบบราชการ</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-semibold">โครงการทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
                </div>
                <FileText className="text-blue-400" size={28} />
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-semibold">ยุทธศาสตร์</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.strategies}</p>
                </div>
                <TrendingUp className="text-green-400" size={28} />
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-semibold">งบประมาณรวม</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{(stats.totalBudget / 1000000).toFixed(1)}M</p>
                </div>
                <DollarSign className="text-yellow-400" size={28} />
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-semibold">ข้อมูลไม่ครบ</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{incompleteProjects.length}</p>
                </div>
                <AlertTriangle className="text-red-400" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-600">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-blue-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาชื่อโครงการ หรือวัตถุประสงค์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Filter size={20} />
              ตัวกรอง
            </button>
            {(searchTerm || selectedStrategy !== 'all' || selectedYear !== 'all' || selectedDept !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 font-semibold transition-all shadow-md"
              >
                <X size={20} />
                ล้าง
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">ยุทธศาสตร์</label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full p-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-medium"
                >
                  <option value="all">ทั้งหมด</option>
                  {strategies.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">ปีงบประมาณ</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-medium"
                >
                  <option value="all">ทั้งหมด</option>
                  {fiscalYears.map(y => (
                    <option key={y} value={y}>พ.ศ. {y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">หน่วยงาน</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full p-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-medium"
                >
                  <option value="all">ทั้งหมด</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-blue-600">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 font-bold text-lg flex items-center justify-between">
                <span>โครงการ ({filteredProjects.length})</span>
                <FileText size={24} />
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredProjects.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">ไม่พบโครงการที่ตรงกับการค้นหา</p>
                  </div>
                ) : (
                  filteredProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`p-5 cursor-pointer transition-all duration-200 ${
                        selectedProject === project.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-bold text-base ${selectedProject === project.id ? 'text-blue-900' : 'text-gray-800'}`}>
                            {project.name}
                          </h3>
                          <p className={`text-sm mt-1 ${selectedProject === project.id ? 'text-blue-700' : 'text-gray-600'}`}>
                            {project.strategyName}
                          </p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              selectedProject === project.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {project.fiscal}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              selectedProject === project.id 
                                ? 'bg-green-600 text-white' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              ฿{(project.budget[project.fiscal] || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Project Detail */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-4 border-t-4 border-blue-600">
              {currentProject ? (
                <>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 font-bold text-lg border-b border-blue-200 flex items-center justify-between">
                    <span>รายละเอียดโครงการ</span>
                    <FileText size={24} />
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[600px]">
                    <div className="space-y-6">
                      {/* ชื่อโครงการ - เด่นที่สุด */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg shadow-md">
                        <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2">ชื่อโครงการ</p>
                        <p className="text-lg text-white font-bold leading-relaxed">{currentProject.name}</p>
                      </div>

                      {/* วัตถุประสงค์ */}
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <p className="text-sm font-bold text-blue-900">วัตถุประสงค์</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pl-4">{currentProject.objective}</p>
                      </div>

                      {/* เป้าหมาย */}
                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <p className="text-sm font-bold text-green-900">เป้าหมาย</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-4">{currentProject.target}</p>
                      </div>

                      {/* KPI */}
                      <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <p className="text-sm font-bold text-purple-900">ตัวชี้วัด (KPI)</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pl-4">{currentProject.kpi || 'ไม่มีการกำหนด'}</p>
                      </div>

                      {/* ผลที่คาดหวัง */}
                      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <p className="text-sm font-bold text-orange-900">ผลที่คาดหวัง</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pl-4">{currentProject.result}</p>
                      </div>

                      {/* หน่วยงาน */}
                      <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-4 rounded-lg border-2 border-slate-300">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">หน่วยงานรับผิดชอบ</p>
                        <p className="text-base text-slate-900 font-bold">{currentProject.dept}</p>
                      </div>

                      {/* งบประมาณ */}
                      <div className="bg-white p-4 rounded-lg border-2 border-yellow-400 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="text-yellow-600" size={20} />
                          <p className="text-sm font-bold text-yellow-900">งบประมาณ (พ.ศ. 2566-2570)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[2566, 2567, 2568, 2569, 2570].map(year => (
                            <div key={year} className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border-2 border-yellow-300 hover:shadow-md transition-shadow">
                              <p className="text-yellow-800 text-xs font-bold mb-1">ปี {year}</p>
                              <p className="font-bold text-yellow-900 text-base">
                                ฿{(currentProject.budget[year] || 0).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {duplicatesWarning.length > 0 && (
                        <div className="mt-5 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                          <div className="flex gap-3 items-start">
                            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                              <p className="text-xs font-bold text-yellow-900 uppercase">⚠ เตือน: พบโครงการที่คล้ายกัน</p>
                              <ul className="text-xs text-yellow-800 mt-2 space-y-1">
                                {duplicatesWarning.map(dup => (
                                  <li key={dup.id}>• {dup.name}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-96">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-gray-400 font-semibold">เลือกโครงการเพื่อดูรายละเอียด</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default LocalDevPlanChecker;