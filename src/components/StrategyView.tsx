import React, { useState } from 'react';
import { 
  Target, GripVertical, X, Plus, Trash2, ArrowUpRight, HelpCircle, Pencil, Check,
  Paperclip, Link, UserPlus, ExternalLink, Sparkles, FileText, Info,
  Upload, Download, FileImage, FileSpreadsheet, Star
} from 'lucide-react';
import { Strategy, ViewState, StrategyLink, Contact } from '../types';

interface StrategyViewProps {
  strategies: Strategy[];
  setStrategies: React.Dispatch<React.SetStateAction<Strategy[]>>;
  viewState: ViewState;
  goToList: () => void;
  goToDetail: (id: number) => void;
  goToCreate: () => void;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  navigateToContact: (id: number) => void;
}

interface DragState {
  stratId: number | null;
  draggedIdx: number | null;
  draggedOverIdx: number | null;
}

const getFileIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.startsWith('image/')) return <FileImage className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (t.includes('pdf')) return <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  if (t.includes('word') || t.includes('document') || t.includes('office') || t.includes('docx')) return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (t.includes('spreadsheet') || t.includes('excel') || t.includes('csv') || t.includes('sheet')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
};

export default function StrategyView({
  strategies,
  setStrategies,
  viewState,
  goToList,
  goToDetail,
  goToCreate,
  contacts,
  setContacts,
  navigateToContact
}: StrategyViewProps) {
  const [activeStrategyId, setActiveStrategyId] = useState<number | null>(null);
  const [newStepName, setNewStepName] = useState('');
  const [newStepRole, setNewStepRole] = useState('');
  const [dragState, setDragState] = useState<DragState>({ 
    stratId: null, 
    draggedIdx: null, 
    draggedOverIdx: null 
  });
  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null);
  const [editGoal, setEditGoal] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Modal connection edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStratId, setModalStratId] = useState<number | null>(null);
  const [modalLinkId, setModalLinkId] = useState<number | null>(null);

  const [modalPerson, setModalPerson] = useState('');
  const [modalRole, setModalRole] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalWhyNeeded, setModalWhyNeeded] = useState('');
  const [modalAttachments, setModalAttachments] = useState<string[]>([]);
  const [modalLinkedContactId, setModalLinkedContactId] = useState<number | null>(null);
  const [attachmentText, setAttachmentText] = useState('');
  const [modalAdditionalAnswers, setModalAdditionalAnswers] = useState<string[]>([]);

  const sortedStrategies = React.useMemo(() => {
    return [...(strategies || [])].sort((a, b) => {
      const aPri = a.isHighPriority ? 1 : 0;
      const bPri = b.isHighPriority ? 1 : 0;
      return bPri - aPri;
    });
  }, [strategies]);

  const handleStartEdit = (strat: Strategy) => {
    setEditingStrategyId(strat.id);
    setEditGoal(strat.goal);
    setEditTarget(strat.target);
    setEditStatus(strat.status || 'Warm Map');
  };

  const handleCancelEdit = () => {
    setEditingStrategyId(null);
  };

  const handleSaveEdit = (stratId: number) => {
    if (!editGoal.trim() || !editTarget.trim()) return;
    setStrategies(prev => prev.map(strat => {
      if (strat.id !== stratId) return strat;
      
      const updatedChain = [...(strat.chain || [])];
      if (updatedChain.length > 0) {
        const lastIdx = updatedChain.length - 1;
        updatedChain[lastIdx] = {
          ...updatedChain[lastIdx],
          person: editTarget.trim()
        };
      }
      
      return {
        ...strat,
        goal: editGoal.trim(),
        target: editTarget.trim(),
        status: editStatus,
        chain: updatedChain
      };
    }));
    setEditingStrategyId(null);
  };

  const handleAddStep = (stratId: number) => {
    if (!newStepName.trim() || !newStepRole.trim()) return;
    
    setStrategies(prev => prev.map(strat => {
      if (strat.id !== stratId) return strat;
      const newChain = [...(strat.chain || [])];
      // Insert right before the last step (which is the target)
      newChain.splice(newChain.length - 1, 0, { 
        id: Date.now(), 
        person: newStepName.trim(), 
        role: newStepRole.trim() 
      });
      return { ...strat, chain: newChain };
    }));

    setActiveStrategyId(null); 
    setNewStepName(''); 
    setNewStepRole('');
  };

  const removeStep = (stratId: number, stepId: number) => {
    setStrategies(prev => prev.map(strat => {
      if (strat.id !== stratId) return strat;
      return { 
        ...strat, 
        chain: (strat.chain || []).filter(step => step.id !== stepId) 
      };
    }));
  };

  const removeGoal = (stratId: number) => {
    if (confirm('Are you sure you want to delete this strategic networking path?')) {
      setStrategies(prev => prev.filter(strat => strat.id !== stratId));
    }
  };

  const handleOpenLinkModal = (strat: Strategy, link: StrategyLink) => {
    setModalStratId(strat.id);
    setModalLinkId(link.id);
    setModalPerson(link.person || '');
    setModalRole(link.role || '');
    setModalDescription(link.description || '');
    setModalWhyNeeded(link.whyNeeded || '');
    setModalAttachments(link.attachments || []);
    setModalLinkedContactId(link.linkedContactId || null);
    setModalAdditionalAnswers(link.additionalAnswers || []);
    setAttachmentText('');
    setModalOpen(true);
  };

  const handleSaveLinkModal = () => {
    if (!modalStratId || !modalLinkId) return;

    // Check if the name or role has changed for a linked contact, and update the directory
    if (modalLinkedContactId) {
      setContacts(prev => prev.map(c => {
        if (c.id === modalLinkedContactId) {
          return {
            ...c,
            name: modalPerson.trim(),
            title: modalRole.trim()
          };
        }
        return c;
      }));
    }

    setStrategies(prev => prev.map(strat => {
      if (strat.id !== modalStratId) return strat;

      const updatedChain = (strat.chain || []).map(link => {
        if (link.id !== modalLinkId) return link;
        return {
          ...link,
          person: modalPerson.trim(),
          role: modalRole.trim(),
          description: modalDescription.trim(),
          whyNeeded: modalWhyNeeded.trim(),
          attachments: modalAttachments,
          linkedContactId: modalLinkedContactId || undefined,
          additionalAnswers: modalAdditionalAnswers.filter(ans => ans.trim() !== '')
        };
      });

      // Also sync back the overall strategy target if this is the target link (the last link)
      const isLastLink = strat.chain.length > 0 && strat.chain[strat.chain.length - 1].id === modalLinkId;
      const updatedTarget = isLastLink ? modalPerson.trim() : strat.target;

      return {
        ...strat,
        target: updatedTarget,
        chain: updatedChain
      };
    }));

    setModalOpen(false);
    setModalStratId(null);
    setModalLinkId(null);
  };

  const handleCreateContactForLink = () => {
    const contactName = modalPerson.trim() || 'Unnamed Connection';
    const contactTitle = modalRole.trim() || 'Intermediary Link';
    
    // Create new contact in the list
    const newContactId = Date.now();
    const newContact: Contact = {
      id: newContactId,
      name: contactName,
      title: contactTitle,
      source: `Strategic Pathway`,
      tags: ['Strategic Sync'],
      skills: [],
      projects: [],
      categories: []
    };
    
    setContacts(prev => [...prev, newContact]);
    setModalLinkedContactId(newContactId);
  };

  const handleAddAttachment = () => {
    if (!attachmentText.trim()) return;
    setModalAttachments(prev => [...prev, attachmentText.trim()]);
    setAttachmentText('');
  };

  const handleRemoveAttachment = (idxToRemove: number) => {
    setModalAttachments(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleAttachmentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttachment();
    }
  };

  const getDisplayLinkInfo = (link: StrategyLink) => {
    if (link.linkedContactId) {
      const contact = contacts.find(c => c.id === link.linkedContactId);
      if (contact) {
        return {
          person: contact.name,
          role: contact.title
        };
      }
    }
    return {
      person: link.person,
      role: link.role
    };
  };

  const handleDragStart = (e: React.DragEvent, stratId: number, idx: number) => { 
    setDragState({ stratId, draggedIdx: idx, draggedOverIdx: idx }); 
    e.dataTransfer.effectAllowed = 'move'; 
  };

  const handleDragOver = (e: React.DragEvent, stratId: number, idx: number) => { 
    e.preventDefault(); 
    if (dragState.stratId === stratId && dragState.draggedOverIdx !== idx) {
      setDragState(prev => ({ ...prev, draggedOverIdx: idx })); 
    }
  };

  const handleDrop = (e: React.DragEvent, stratId: number, dropIdx: number) => {
    e.preventDefault();
    if (
      dragState.stratId !== stratId || 
      dragState.draggedIdx === null || 
      dragState.draggedIdx === dropIdx
    ) return;

    setStrategies(prev => prev.map(strat => {
      if (strat.id !== stratId) return strat;
      const newChain = [...(strat.chain || [])];
      
      // Prevent dragging/dropping the very first ("Me") or very last ("Target") links
      if (
        dropIdx === 0 || 
        dropIdx === newChain.length - 1 || 
        dragState.draggedIdx === 0 || 
        dragState.draggedIdx === newChain.length - 1
      ) return strat;

      const [draggedItem] = newChain.splice(dragState.draggedIdx!, 1);
      newChain.splice(dropIdx, 0, draggedItem);
      return { ...strat, chain: newChain };
    }));

    setDragState({ stratId: null, draggedIdx: null, draggedOverIdx: null });
  };

  if (viewState.view === 'create') {
    return <StrategyForm goToList={goToList} setStrategies={setStrategies} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Strategic Networking Map</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Graph warm-introduction paths (intermediaries) to target high-leverage profiles.
        </p>
      </div>

      <div className="space-y-5">
        {sortedStrategies.map((strat, idx) => (
          <div 
            key={strat.id} 
            id={`strategy-card-${strat.id}`}
            data-tour-id={idx === 0 ? "strategy-first-card" : undefined}
            className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative transition-all duration-300 ${
              editingStrategyId === strat.id 
                ? 'border-indigo-500 bg-zinc-900/90 shadow-[0_0_20px_rgba(0,123,255,0.1)] ring-1 ring-indigo-500/30' 
                : strat.isHighPriority
                  ? 'border-indigo-500/50 bg-gradient-to-b from-zinc-900 to-indigo-950/20 shadow-[0_4px_25px_rgba(0,123,255,0.12)] hover:border-indigo-500/70 hover:shadow-2xl'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-2xl'
            }`}
          >
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-5 border-b border-zinc-800/60 pb-4 gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-white mb-1 tracking-tight font-display break-words">
                  {editingStrategyId === strat.id ? (
                    <input 
                      id={`edit-goal-input-${strat.id}`}
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-xl px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={editGoal}
                      onChange={e => setEditGoal(e.target.value)}
                      placeholder="Networking Objective"
                    />
                  ) : (
                    strat.goal
                  )}
                </h3>
                <div className="text-xs text-zinc-400 flex items-center gap-1.5 break-words min-w-0 font-mono">
                  <Target className="w-4 h-4 text-indigo-400 shrink-0" /> Target Profile:{" "}
                  {editingStrategyId === strat.id ? (
                    <input 
                      id={`edit-target-input-${strat.id}`}
                      type="text"
                      className="bg-zinc-950 border border-zinc-850 text-white rounded-xl px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none ml-1 font-sans"
                      value={editTarget}
                      onChange={e => setEditTarget(e.target.value)}
                      placeholder="Target Profile Name"
                    />
                  ) : (
                    <strong className="text-white font-semibold">{strat.target}</strong>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start shrink-0">
                {editingStrategyId === strat.id ? (
                  <>
                    <select
                      id={`edit-status-select-${strat.id}`}
                      className="text-[10px] bg-zinc-950 text-indigo-400 border border-zinc-800 px-2.5 py-1.5 rounded-md font-mono font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                    >
                      <option value="Warm Map" className="bg-zinc-900 text-white">Warm Map</option>
                      <option value="In Progress" className="bg-zinc-900 text-white">In Progress</option>
                      <option value="Connected" className="bg-zinc-900 text-white">Connected</option>
                      <option value="Closed" className="bg-zinc-900 text-white">Closed</option>
                    </select>
                    <button 
                      id={`save-edit-goal-${strat.id}`}
                      onClick={() => handleSaveEdit(strat.id)} 
                      className="text-emerald-500 hover:text-emerald-400 p-1.5 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
                      title="Save Changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      id={`cancel-edit-goal-${strat.id}`}
                      onClick={handleCancelEdit} 
                      className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
                      title="Cancel Editing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900/30 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider shrink-0">
                      {strat.status}
                    </span>
                    <button
                      id={`toggle-strategy-priority-${strat.id}`}
                      type="button"
                      onClick={() => {
                        setStrategies(prev => prev.map(s => s.id === strat.id ? { ...s, isHighPriority: !s.isHighPriority } : s));
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        strat.isHighPriority
                          ? 'bg-indigo-600/20 text-amber-300 border-indigo-500/30'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-850 border-transparent'
                      }`}
                      title={strat.isHighPriority ? "Remove high priority status" : "Mark as high priority"}
                    >
                      <Star className={`w-4 h-4 ${strat.isHighPriority ? 'fill-amber-300 text-amber-300' : ''}`} />
                    </button>
                    <button 
                      id={`edit-goal-trigger-${strat.id}`}
                      onClick={() => handleStartEdit(strat)} 
                      className="text-zinc-500 hover:text-indigo-400 p-1.5 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
                      title="Edit Strategic Goal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      id={`delete-goal-${strat.id}`}
                      onClick={() => removeGoal(strat.id)} 
                      className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
                      title="Remove Strategic Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Introduction Chain nodes */}
            <div className="mt-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-zinc-800/80 pl-1">
              {(strat.chain || []).map((link, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === (strat.chain || []).length - 1;
                const isDraggable = !isFirst && !isLast;
                const isDragging = dragState.stratId === strat.id && dragState.draggedIdx === idx;
                const isDraggedOver = dragState.stratId === strat.id && dragState.draggedOverIdx === idx && isDraggable && !isDragging;
                
                const displayInfo = getDisplayLinkInfo(link);

                return (
                  <div 
                    key={link.id} 
                    className={`relative flex items-start mb-4 sm:mb-5 last:mb-0 group select-none ${
                      isDragging ? 'opacity-30' : ''
                    } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                    draggable={isDraggable} 
                    onDragStart={(e) => isDraggable && handleDragStart(e, strat.id, idx)} 
                    onDragOver={(e) => isDraggable && handleDragOver(e, strat.id, idx)} 
                    onDrop={(e) => isDraggable && handleDrop(e, strat.id, idx)} 
                    onDragEnd={() => setDragState({ stratId: null, draggedIdx: null, draggedOverIdx: null })}
                  >
                    {/* Circle Node Pin */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-[3px] border-zinc-900 ${
                      isFirst 
                        ? 'bg-zinc-600' 
                        : isLast 
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/10' 
                        : 'bg-indigo-500 ring-2 ring-indigo-500/10'
                    }`}>
                      {isLast && <Target className="w-3 h-3 text-zinc-950 shrink-0" />}
                    </div>
                    
                    {/* Visual Card containing Connector Person */}
                    <div 
                      id={`path-card-${link.id}`}
                      onClick={() => handleOpenLinkModal(strat, link)}
                      className={`ml-3 sm:ml-4 bg-zinc-950 px-4 py-3 rounded-2xl border cursor-pointer hover:bg-zinc-900 hover:border-indigo-500/40 hover:shadow-[0_0_12px_rgba(0,123,255,0.03)] transition-all ${
                        isDraggedOver 
                          ? 'border-indigo-500 border-dashed bg-indigo-950/40 shadow-inner scale-[1.01]' 
                          : 'border-zinc-850'
                      } w-full flex flex-col group-hover:border-zinc-700 transition-all min-w-0 shadow-sm`}
                    >
                      <div className="flex justify-between items-center w-full min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {isDraggable && (
                            <div className="text-zinc-600 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-zinc-100 font-display flex items-center flex-wrap gap-1.5 break-words">
                              <span className="truncate">{displayInfo.person}</span>
                              {link.linkedContactId && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-mono font-semibold shrink-0">
                                  <Link className="w-2.5 h-2.5" /> Synced
                                </span>
                              )}
                              {link.attachments && link.attachments.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono font-semibold shrink-0" title={`${link.attachments.length} resources`}>
                                  <Paperclip className="w-2.5 h-2.5" /> {link.attachments.length}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 leading-tight truncate break-words">
                              {displayInfo.role}
                            </div>
                          </div>
                        </div>
                        
                        {/* Delete node step */}
                        {!isFirst && !isLast && (
                          <button 
                            id={`delete-step-${link.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(strat.id, link.id);
                            }} 
                            className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/5 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 active:scale-90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {link.whyNeeded && (
                        <div className="text-[10px] text-zinc-400 italic mt-2 border-t border-zinc-900/60 pt-2 leading-relaxed flex items-start gap-1">
                          <span className="text-indigo-400 font-bold shrink-0">Why:</span>
                          <span className="line-clamp-2 break-words">{link.whyNeeded}</span>
                        </div>
                      )}

                      {link.additionalAnswers && link.additionalAnswers.length > 0 && (
                        <div className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed flex flex-col gap-0.5 border-t border-zinc-900/60 pt-1.5">
                          {link.additionalAnswers.map((ans, aIdx) => (
                            <div key={aIdx} className="flex items-start gap-1">
                              <span className="text-indigo-400 shrink-0 font-bold">✓</span>
                              <span className="line-clamp-1 truncate break-all">{ans}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Action buttons (Add Step) */}
            {activeStrategyId === strat.id ? (
              <div className="mt-5 bg-zinc-950 p-4 rounded-2xl border border-indigo-500/20 space-y-3 animate-fade-in">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Insert Intermediary Link</h4>
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500" title="Add a person who can bridge the gap from you to David." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    id="step-person-name"
                    type="text" 
                    placeholder="Connector's Full Name" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600" 
                    value={newStepName} 
                    onChange={e => setNewStepName(e.target.value)} 
                  />
                  <input 
                    id="step-person-role"
                    type="text" 
                    placeholder="Their connection or warm role" 
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600" 
                    value={newStepRole} 
                    onChange={e => setNewStepRole(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAddStep(strat.id)}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    id="save-step-btn"
                    onClick={() => handleAddStep(strat.id)} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Add Connector
                  </button>
                  <button 
                    id="cancel-step-btn"
                    onClick={() => { setActiveStrategyId(null); setNewStepName(''); setNewStepRole(''); }} 
                    className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold py-2.5 rounded-xl transition-all border border-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                id={`add-step-trigger-${strat.id}`}
                onClick={() => { setActiveStrategyId(strat.id); setNewStepName(''); setNewStepRole(''); }} 
                className="mt-5 w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/20 hover:bg-indigo-950/20 text-zinc-400 hover:text-indigo-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-inner active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 shrink-0 text-indigo-400" /> Insert warm intro pathway connection
              </button>
            )}
          </div>
        ))}
        
        {/* Main Target Creator button */}
        <button 
          id="add-goal-btn"
          onClick={goToCreate} 
          className="w-full bg-zinc-900 border-2 border-dashed border-zinc-800 text-zinc-400 font-bold py-5 rounded-3xl hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-[0.99]"
        >
          <Target className="w-5 h-5 shrink-0 text-indigo-400" /> Map New Strategic Goal Target
        </button>
      </div>

      {/* Edit Pathway Link Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div 
            id="edit-pathway-modal"
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-8 space-y-5 animate-slide-in-up sm:animate-scale-up pb-safe"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden -mt-1 pb-2 flex justify-center">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/15 p-2 rounded-xl text-indigo-400 border border-indigo-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display">Configure Pathway Connection</h3>
                  <p className="text-[11px] text-zinc-400">Specify introduction logic, resources, and contact associations</p>
                </div>
              </div>
              <button 
                id="close-modal-btn"
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>


            {/* Modal Grid content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Basic Info & Necessity */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">Connection Name *</label>
                  <input
                    id="modal-person-name"
                    type="text"
                    value={modalPerson}
                    onChange={(e) => setModalPerson(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Enter name (e.g. David Wallace, Sarah Jenkins)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">Context or Warm Relationship *</label>
                  <input
                    id="modal-person-role"
                    type="text"
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="E.g. Worked with target at Google, common friend"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">Why is this specific step/person needed? *</label>
                  <textarea
                    id="modal-person-why-needed"
                    value={modalWhyNeeded}
                    onChange={(e) => setModalWhyNeeded(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="E.g. This step is critical because David trusts Sarah explicitly. Sarah can recommend my SaaS directly."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-1.5">Additional Intermediary Details</label>
                  <textarea
                    id="modal-person-description"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Meeting locations, shared hobbies, previous topics spoken about..."
                  />
                </div>

                {/* Multiple Answer Dynamic Text Boxes Section */}
                <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Custom Insights & Answers</label>
                    <button
                      type="button"
                      id="add-custom-answer-btn"
                      onClick={() => setModalAdditionalAnswers(prev => [...prev, ''])}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Answer Box
                    </button>
                  </div>
                  
                  {modalAdditionalAnswers.length > 0 ? (
                    <div className="space-y-3">
                      {modalAdditionalAnswers.map((answer, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <textarea
                            id={`custom-answer-textarea-${index}`}
                            value={answer}
                            onChange={(e) => {
                              const updated = [...modalAdditionalAnswers];
                              updated[index] = e.target.value;
                              setModalAdditionalAnswers(updated);
                            }}
                            rows={2}
                            className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                            placeholder={`Enter additional detail or key question answer #${index + 1}`}
                          />
                          <button
                            id={`delete-custom-answer-btn-${index}`}
                            type="button"
                            onClick={() => {
                              setModalAdditionalAnswers(prev => prev.filter((_, idx) => idx !== index));
                            }}
                            className="bg-zinc-950 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 p-2 rounded-xl border border-zinc-800 hover:border-red-500/25 transition-all cursor-pointer shrink-0 mt-1"
                            title="Delete this answer box"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">No custom answers or additional criteria added yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Rolodox Link & Attachments */}
              <div className="space-y-4">
                {/* Contact Profile Association */}
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Rolodox Card Hyperlink</h4>
                    {modalLinkedContactId && (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">Linked</span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    You can either hyperlink this pathway to an existing Rolodox profile directory or spin up a new profile.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Associate Directory Profile</label>
                    <select
                      id="modal-linked-contact-select"
                      value={modalLinkedContactId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setModalLinkedContactId(null);
                        } else {
                          const cid = Number(val);
                          setModalLinkedContactId(cid);
                          const contact = contacts.find(c => c.id === cid);
                          if (contact) {
                            setModalPerson(contact.name);
                            setModalRole(contact.title);
                          }
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="">-- No linked contact profile --</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.title})</option>
                      ))}
                    </select>
                  </div>

                  {modalLinkedContactId ? (
                    <div className="pt-1 flex flex-col gap-2">
                      <div className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5 bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10">
                        <Check className="w-4 h-4 text-emerald-400" /> Linked to {contacts.find(c => c.id === modalLinkedContactId)?.name || 'Connection'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          id="view-linked-contact-btn"
                          type="button"
                          onClick={() => {
                            if (modalLinkedContactId) {
                              setModalOpen(false);
                              navigateToContact(modalLinkedContactId);
                            }
                          }}
                          className="flex-1 text-[11px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-400 hover:text-indigo-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Rolodox Card
                        </button>
                        <button
                          id="unlink-contact-btn"
                          type="button"
                          onClick={() => {
                            setModalLinkedContactId(null);
                          }}
                          className="text-[11px] bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                          title="Unlink contact card"
                        >
                          <X className="w-3.5 h-3.5" /> Unlink
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        id="create-linked-contact-btn"
                        type="button"
                        onClick={handleCreateContactForLink}
                        className="w-full bg-indigo-600/10 hover:bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Create & Link New Rolodox Card
                      </button>
                    </div>
                  )}
                </div>

                {/* Attachments & Resources Section */}
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments & Resources
                  </h4>

                  {/* Dynamic File Selector Dropzone */}
                  <div className="border border-dashed border-zinc-800 hover:border-indigo-500/30 rounded-xl p-3.5 bg-zinc-900/40 text-center transition-all relative cursor-pointer">
                    <input
                      type="file"
                      id="file-attachment-upload-input"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach((file: File) => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            const fileObj = {
                              name: file.name,
                              type: file.type,
                              data: result
                            };
                            setModalAttachments(prev => [...prev, JSON.stringify(fileObj)]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Upload className="w-5 h-5 text-indigo-400" />
                      <span className="text-[11px] text-zinc-300 font-bold">Upload Local Attachment</span>
                      <span className="text-[9px] text-zinc-500">Supports PDFs, Word Docs, all images, sheets, etc.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 my-2">
                    <div className="h-[1px] bg-zinc-850 flex-1"></div>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-mono">Or link web resource</span>
                    <div className="h-[1px] bg-zinc-850 flex-1"></div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      id="modal-attachment-input"
                      type="text"
                      value={attachmentText}
                      onChange={(e) => setAttachmentText(e.target.value)}
                      onKeyDown={handleAttachmentKeyDown}
                      placeholder="E.g. pitch_deck.pdf, resume.md"
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600"
                    />
                    <button
                      id="add-attachment-btn"
                      type="button"
                      onClick={handleAddAttachment}
                      className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {modalAttachments.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      {modalAttachments.map((attach, aIdx) => {
                        // Parse attachment
                        let info = { name: attach, type: 'link', data: attach, isUploaded: false };
                        if (attach.startsWith('{')) {
                          try {
                            const parsed = JSON.parse(attach);
                            if (parsed.name) {
                              info = {
                                name: parsed.name,
                                type: parsed.type || 'unknown',
                                data: parsed.data || '',
                                isUploaded: true
                              };
                            }
                          } catch {
                            // fallback
                          }
                        }

                        const fileIcon = info.isUploaded ? getFileIcon(info.type) : <Link className="w-3.5 h-3.5 text-zinc-500 shrink-0" />;

                        return (
                          <div key={aIdx} className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-850 text-[11px] text-zinc-300">
                            <span className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                              {fileIcon}
                              {info.isUploaded ? (
                                <a
                                  href={info.data}
                                  download={info.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                                  title="Click to Download/View"
                                >
                                  {info.name} <Download className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                </a>
                              ) : (
                                <a 
                                  href={info.data.startsWith('http') ? info.data : `https://${info.data}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                  title={info.data}
                                >
                                  {info.name}
                                </a>
                              )}
                            </span>
                            <button
                              id={`remove-attachment-${aIdx}`}
                              type="button"
                              onClick={() => handleRemoveAttachment(aIdx)}
                              className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1 hover:bg-zinc-800"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 text-center py-2 italic">
                      No attached resources or files yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <button
                id="modal-cancel-btn"
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                id="modal-save-btn"
                type="button"
                onClick={handleSaveLinkModal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Save Connection Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- NEW STRATEGY TARGET FORM ---
interface StrategyFormProps {
  goToList: () => void;
  setStrategies: React.Dispatch<React.SetStateAction<Strategy[]>>;
}

function StrategyForm({ goToList, setStrategies }: StrategyFormProps) {
  const [formData, setFormData] = useState({ goal: '', target: '', isHighPriority: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.goal.trim() || !formData.target.trim()) return;

    const newStrategy: Strategy = {
      id: Date.now(),
      goal: formData.goal.trim(),
      target: formData.target.trim(),
      status: 'Warm Map',
      chain: [
        { id: Date.now() + 1, person: 'Me', role: 'Relationship Owner' },
        { id: Date.now() + 2, person: formData.target.trim(), role: 'Target Influence Profile' }
      ],
      isHighPriority: formData.isHighPriority
    };

    setStrategies(prev => [...prev, newStrategy]);
    goToList();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">New Strategic Goal Target</h2>
        <button 
          onClick={goToList} 
          className="p-2 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
        >
          <X className="text-zinc-400 w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider font-mono">What is the Networking Objective? *</label>
            <input 
              id="strat-form-goal"
              required 
              type="text" 
              placeholder="E.g., Meet VP of Engineering at Stripe or Partner with a Seed VC"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600" 
              value={formData.goal} 
              onChange={e => setFormData({...formData, goal: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider font-mono">Who is the Target Person? *</label>
            <input 
              id="strat-form-target"
              required 
              type="text" 
              placeholder="E.g., David Wallace"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600" 
              value={formData.target} 
              onChange={e => setFormData({...formData, target: e.target.value})} 
            />
          </div>

          <div className="flex items-center gap-3 pt-2.5 border-t border-zinc-850">
            <input 
              type="checkbox" 
              id="strat-form-high-priority"
              className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              checked={formData.isHighPriority}
              onChange={e => setFormData({...formData, isHighPriority: e.target.checked})}
            />
            <label htmlFor="strat-form-high-priority" className="text-xs font-bold text-zinc-300 cursor-pointer select-none uppercase tracking-wider font-mono">
              Mark as High Priority Strategy
            </label>
          </div>
        </div>

        <button 
          id="save-strat-btn"
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all"
        >
          Initialize Strategic Pathway
        </button>
      </form>
    </div>
  );
}
