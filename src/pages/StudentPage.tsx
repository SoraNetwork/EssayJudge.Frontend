import React, { useState } from 'react';
import { getStudents, createStudent } from '../api';

const StudentPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');

  const fetchStudents = async () => {
    const res = await getStudents();
    setStudents(res.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStudent({ name });
    fetchStudents();
  };

  return (
    <div>
      <button onClick={fetchStudents}>查询学生</button>
      <ul>
        {students.map(s => <li key={s.id}>{s.name}</li>)}
      </ul>
      <form onSubmit={handleCreate}>
        <input placeholder="学生姓名" value={name} onChange={e => setName(e.target.value)} />
        <button type="submit">新建学生</button>
      </form>
    </div>
  );
};

export default StudentPage;