import React, { useEffect, useState } from 'react';
import { getEssayAssignments, createEssayAssignment } from '../api';

type Assignment = {
  id: string;
  title: string;
  grade: string;
  totalScore: number;
  baseScore: number;
  titleContext?: string;
  scoringCriteria?: string;
  createTime?: string;
};

const gradeOptions = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三'
];

const EssayAssignmentPage = () => {
  // 查询相关
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{start?: string, end?: string}>({});
  const [filtered, setFiltered] = useState<Assignment[]>([]);

  // 新建弹窗相关
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [baseScore, setBaseScore] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [grade, setGrade] = useState('');
  const [titleContext, setTitleContext] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  // 查询测验
  const fetchAssignments = async (params?: any) => {
    const res = await getEssayAssignments(params);
    setAssignments(res.data);
  };

  // 处理筛选
  useEffect(() => {
    let result = assignments;
    // 按时间筛选
    if (dateRange.start || dateRange.end) {
      result = result.filter(a => {
        if (!a.createTime) return true;
        const t = new Date(a.createTime).getTime();
        if (dateRange.start && t < new Date(dateRange.start).getTime()) return false;
        if (dateRange.end && t > new Date(dateRange.end).getTime()) return false;
        return true;
      });
    }
    setFiltered(result);
  }, [assignments, dateRange]);

  // 搜索
  const handleSearch = () => {
    if (!search) {
      fetchAssignments();
    } else {
      // 支持按标题或GUID
      const params: any = {};
      if (/^[0-9a-fA-F-]{36}$/.test(search)) params.id = search;
      else params.title = search;
      fetchAssignments(params);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  // 新建测验弹窗分步逻辑
  const canNext = () => {
    if (step === 1) return !!baseScore && !!totalScore && !isNaN(Number(baseScore)) && !isNaN(Number(totalScore));
    if (step === 2) return !!grade;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  const handleNext = async () => {
    if (step < 4) setStep(step + 1);
    else if (step === 4) {
      setCreating(true);
      await createEssayAssignment({
        baseScore: Number(baseScore),
        totalScore: Number(totalScore),
        grade,
        titleContext,
        scoringCriteria
      });
      setCreating(false);
      setDone(true);
      fetchAssignments();
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setStep(1);
    setBaseScore('');
    setTotalScore('');
    setGrade('');
    setTitleContext('');
    setScoringCriteria('');
    setDone(false);
  };

  return (
    <div style={{padding: 24}}>
      {/* 顶部筛选窗体 */}
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16}}>
        {/* 时间筛选 */}
        <div>
          <label>起始日期: <input type="date" onChange={e => setDateRange(r => ({...r, start: e.target.value}))} /></label>
          <label style={{marginLeft: 8}}>结束日期: <input type="date" onChange={e => setDateRange(r => ({...r, end: e.target.value}))} /></label>
        </div>
        {/* 搜索与新建 */}
        <div style={{display: 'flex', alignItems: 'center'}}>
          <input
            placeholder="按标题关键字或GUID搜索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{marginRight: 8}}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button onClick={handleSearch} style={{marginRight: 16}}>搜索</button>
          <button onClick={() => setShowModal(true)}>创建测验</button>
        </div>
      </div>
      {/* 测验条目列表 */}
      <div>
        {filtered.map(a => (
          <div key={a.id} style={{
            border: '1px solid #eee', borderRadius: 8, marginBottom: 16, padding: 16, display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px #f0f1f2'
          }}>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 'bold', fontSize: 18}}>{a.title || a.titleContext || '无标题'}</div>
              <div style={{fontSize: 12, color: '#888', marginTop: 8}}>{a.createTime ? new Date(a.createTime).toLocaleString() : ''}</div>
            </div>
            <div style={{flex: 1, textAlign: 'left', fontSize: 12, color: '#888'}}>
              {a.createTime ? new Date(a.createTime).toLocaleDateString() : ''}
            </div>
            <div style={{flex: 'none'}}>
              <button onClick={() => alert(JSON.stringify(a, null, 2))}>详细信息</button>
            </div>
          </div>
        ))}
      </div>
      {/* 新建测验弹窗 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 360, minHeight: 180,
            padding: 32, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch'
          }}>
            {!done ? (
              <>
                {step === 1 && (
                  <div>
                    <div style={{marginBottom: 16}}>
                      <label>基准分</label><br />
                      <input
                        type="number"
                        value={baseScore}
                        onChange={e => setBaseScore(e.target.value.replace(/\D/g, ''))}
                        style={{width: 200, marginBottom: 8}}
                      />
                    </div>
                    <div>
                      <label>满分</label><br />
                      <input
                        type="number"
                        value={totalScore}
                        onChange={e => setTotalScore(e.target.value.replace(/\D/g, ''))}
                        style={{width: 200}}
                      />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <label>年级</label><br />
                    <select value={grade} onChange={e => setGrade(e.target.value)} style={{width: 200}}>
                      <option value="">请选择年级</option>
                      {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <label>题目背景或具体题目（可为空）</label><br />
                    <textarea
                      value={titleContext}
                      onChange={e => setTitleContext(e.target.value)}
                      style={{width: 320, minHeight: 60, resize: 'vertical'}}
                    />
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <label>评分标准（可为空）</label><br />
                    <textarea
                      value={scoringCriteria}
                      onChange={e => setScoringCriteria(e.target.value)}
                      style={{width: 320, minHeight: 60, resize: 'vertical'}}
                    />
                  </div>
                )}
                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 24}}>
                  {step > 1 && <button onClick={() => setStep(step - 1)} style={{marginRight: 16}}>上一步</button>}
                  <button
                    onClick={handleNext}
                    disabled={!canNext() || creating}
                    style={{
                      background: canNext() ? '#1890ff' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 24px',
                      cursor: canNext() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {step === 4 ? (creating ? '创建中...' : '完成') : '下一步'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', minWidth: 320}}>
                <div style={{fontSize: 24, marginBottom: 24}}>完成！</div>
                <div style={{display: 'flex', justifyContent: 'center', gap: 24}}>
                  <button onClick={() => { window.location.href = '/essay-submission'; }}>前往批改作文</button>
                  <button onClick={handleModalClose}>关闭</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EssayAssignmentPage;