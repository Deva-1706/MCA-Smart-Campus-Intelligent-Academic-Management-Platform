import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Network, CheckCircle2, Plus } from 'lucide-react';

interface KnowledgeGraphViewProps {
  mode?: 'student' | 'faculty' | 'admin';
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ mode = 'student' }) => {
  const {
    currentUser,
    allSubjects,
    subjectPdfs,
    projects,
    knowledgeNodes,
    knowledgeEdges,
    addKnowledgeEdge,
    verifyKnowledgeEdge,
  } = usePortal();

  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(knowledgeNodes[0]?.id || 'kn-sem1');
  const [fromId, setFromId] = useState<string>(knowledgeNodes[1]?.id || 'kn-435c1a');
  const [toId, setToId] = useState<string>(knowledgeNodes[5]?.id || 'kn-logic');
  const [relation, setRelation] = useState<'contains' | 'prerequisite_for' | 'covers' | 'applied_in'>('prerequisite_for');

  // Enrich graph dynamically with published PDFs and submitted projects
  const publishedPdfNodes = subjectPdfs
    .filter(p => p.status !== 'Draft')
    .slice(0, 6)
    .map(p => ({
      id: `kn-pdf-${p.id}`,
      label: p.topic || p.title,
      nodeType: 'Topic' as const,
      subjectCode: p.subjectCode,
      summary: `Published study material (${p.pageCount} pages, Unit ${p.unit}): ${p.title}`,
    }));

  const projectNodes = projects.slice(0, 4).map(proj => ({
    id: `kn-proj-${proj.id}`,
    label: proj.title,
    nodeType: 'Project' as const,
    subjectCode: proj.subjectCode,
    summary: `${proj.status} MCA Project by ${proj.studentName}: ${proj.description}`,
  }));

  const mergedNodes = [
    ...knowledgeNodes,
    ...publishedPdfNodes.filter(pn => !knowledgeNodes.some(kn => kn.id === pn.id || kn.label === pn.label)),
    ...projectNodes.filter(pr => !knowledgeNodes.some(kn => kn.id === pr.id || kn.label === pr.label)),
  ];

  const dynamicEdges = [
    ...knowledgeEdges,
    ...publishedPdfNodes
      .filter(pn => !knowledgeNodes.some(kn => kn.id === pn.id || kn.label === pn.label))
      .map(pn => {
        const subNode = mergedNodes.find(n => n.nodeType === 'Subject' && n.subjectCode === pn.subjectCode);
        return subNode
          ? {
              id: `ke-${pn.id}`,
              fromId: subNode.id,
              toId: pn.id,
              relation: 'covers' as const,
              verified: true,
              createdBy: 'Faculty Content Sync',
            }
          : null;
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e)),
    ...projectNodes
      .filter(pr => !knowledgeNodes.some(kn => kn.id === pr.id || kn.label === pr.label))
      .map(pr => {
        const subNode = mergedNodes.find(n => n.nodeType === 'Subject' && n.subjectCode === pr.subjectCode);
        return subNode
          ? {
              id: `ke-${pr.id}`,
              fromId: subNode.id,
              toId: pr.id,
              relation: 'applied_in' as const,
              verified: true,
              createdBy: 'Project Studio Sync',
            }
          : null;
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e)),
  ];

  const visibleNodes = mergedNodes.filter(
    n => filterSubject === 'ALL' || !n.subjectCode || n.subjectCode === filterSubject
  );
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = dynamicEdges.filter(
    e => visibleNodeIds.has(e.fromId) && visibleNodeIds.has(e.toId)
  );

  // Lay out nodes cleanly in 4 layered columns (Semester -> Subject -> Topic -> Project)
  const colPositions: Record<string, number> = {
    Semester: 80,
    Subject: 250,
    Topic: 470,
    Project: 680,
  };

  const nodeCoords: Record<string, { x: number; y: number }> = {};
  const groupedByCol: Record<string, typeof visibleNodes> = {
    Semester: [],
    Subject: [],
    Topic: [],
    Project: [],
  };
  visibleNodes.forEach(n => {
    const key = groupedByCol[n.nodeType] ? n.nodeType : 'Topic';
    groupedByCol[key].push(n);
  });

  Object.entries(groupedByCol).forEach(([col, list]) => {
    const x = colPositions[col] ?? 470;
    const stepY = 340 / Math.max(1, list.length + 1);
    list.forEach((n, idx) => {
      nodeCoords[n.id] = { x, y: Math.round(stepY * (idx + 1)) };
    });
  });

  const activeNode =
    mergedNodes.find(n => n.id === selectedNodeId) || visibleNodes[0] || mergedNodes[0];

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId === toId) return;
    addKnowledgeEdge({
      fromId,
      toId,
      relation,
      verified: mode === 'faculty' || mode === 'admin',
      createdBy: currentUser?.name || 'HCASICAN',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <Network className="w-4 h-4" /> Academic Concept Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            MCA Curriculum Knowledge Graph
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            Click any node below to trace how Semesters, Subjects, Published Faculty Topics, and Applied Projects connect.
          </p>
        </div>

        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
          aria-label="Filter Knowledge Graph by Subject"
        >
          <option value="ALL">All Semester 1 Concepts</option>
          {allSubjects.map(s => (
            <option key={s.code} value={s.code}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Color Legend & How to Read Guide */}
      <div className="p-3.5 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[#6E6863] dark:text-[#BDB7B2]">
          <strong className="text-[#292929] dark:text-[#F7F5F2]">How to Read:</strong> Click any node rectangle to inspect connected syllabus topics and prerequisites on the right.
        </span>
        <div className="flex flex-wrap items-center gap-3 font-bold text-[11px]">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#292929]" /> Semester</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#B83232]" /> Subject</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#795548]" /> Published Topic</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#F2C94C]" /> Project</span>
        </div>
      </div>

      {/* Interactive SVG Graph + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs overflow-x-auto">
          <svg
            viewBox="0 0 780 350"
            className="w-full min-w-[640px] h-[340px]"
            role="img"
            aria-label="MCA Curriculum Knowledge Graph Visualization"
          >
            {/* Column Headers */}
            <text x="80" y="20" textAnchor="middle" className="fill-[#795548] dark:fill-[#BDB7B2] text-[10px] font-bold">
              SEMESTER
            </text>
            <text x="250" y="20" textAnchor="middle" className="fill-[#795548] dark:fill-[#BDB7B2] text-[10px] font-bold">
              SUBJECTS
            </text>
            <text x="470" y="20" textAnchor="middle" className="fill-[#795548] dark:fill-[#BDB7B2] text-[10px] font-bold">
              CORE TOPICS
            </text>
            <text x="680" y="20" textAnchor="middle" className="fill-[#795548] dark:fill-[#BDB7B2] text-[10px] font-bold">
              APPLIED PROJECTS
            </text>

            {/* Edges */}
            {visibleEdges.map(edge => {
              const p1 = nodeCoords[edge.fromId];
              const p2 = nodeCoords[edge.toId];
              if (!p1 || !p2) return null;
              const isHighlighted = edge.fromId === activeNode?.id || edge.toId === activeNode?.id;
              return (
                <line
                  key={edge.id}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHighlighted ? '#B83232' : '#795548'}
                  strokeOpacity={isHighlighted ? 0.95 : 0.35}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.relation === 'prerequisite_for' ? '4 3' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map(node => {
              const pos = nodeCoords[node.id];
              if (!pos) return null;
              const isSelected = activeNode?.id === node.id;
              const fill =
                node.nodeType === 'Semester'
                  ? '#292929'
                  : node.nodeType === 'Subject'
                  ? '#B83232'
                  : node.nodeType === 'Project'
                  ? '#F2C94C'
                  : '#795548';
              const textFill = node.nodeType === 'Project' ? '#292929' : '#FFFFFF';
              const shortLabel =
                node.label.length > 22 ? node.label.slice(0, 20) + '...' : node.label;
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer"
                >
                  <rect
                    x={pos.x - 74}
                    y={pos.y - 18}
                    width={148}
                    height={36}
                    rx={8}
                    fill={fill}
                    stroke={isSelected ? '#F2C94C' : '#FFFFFF'}
                    strokeWidth={isSelected ? 3 : 1}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={textFill}
                    className="text-[10px] font-bold pointer-events-none select-none"
                  >
                    {shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details & Edges */}
        <div className="lg:col-span-4 space-y-4">
          {activeNode && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs space-y-3">
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C]">
                {activeNode.nodeType} {activeNode.subjectCode ? `· ${activeNode.subjectCode}` : ''}
              </span>
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                {activeNode.label}
              </h2>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                {activeNode.summary}
              </p>

              <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
                <span className="text-[11px] font-bold uppercase text-[#795548] dark:text-[#BDB7B2]">
                  Connected Concept Edges
                </span>
                {dynamicEdges
                  .filter(e => e.fromId === activeNode.id || e.toId === activeNode.id)
                  .map(edge => {
                    const fromNode = mergedNodes.find(n => n.id === edge.fromId);
                    const toNode = mergedNodes.find(n => n.id === edge.toId);
                    return (
                      <div
                        key={edge.id}
                        className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[11px] flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          <strong>{fromNode?.label}</strong> → <em>{edge.relation}</em> →{' '}
                          <strong>{toNode?.label}</strong>
                        </span>
                        {edge.verified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          mode !== 'student' && (
                            <button
                              type="button"
                              onClick={() => verifyKnowledgeEdge(edge.id)}
                              className="text-[10px] font-bold text-[#B83232] underline shrink-0"
                            >
                              Verify
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {(mode === 'faculty' || mode === 'admin') && (
            <form
              onSubmit={handleAddEdge}
              className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3 text-xs"
            >
              <h3 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Add Concept Relationship
              </h3>
              <select
                value={fromId}
                onChange={e => setFromId(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {knowledgeNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    From: {n.label}
                  </option>
                ))}
              </select>
              <select
                value={relation}
                onChange={e => setRelation(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value="prerequisite_for">prerequisite_for</option>
                <option value="covers">covers</option>
                <option value="applied_in">applied_in</option>
                <option value="contains">contains</option>
              </select>
              <select
                value={toId}
                onChange={e => setToId(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {knowledgeNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    To: {n.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add & Verify Relationship</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
