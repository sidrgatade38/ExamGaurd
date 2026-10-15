import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import questionPaperService from '../services/questionPaperService';
import answerKeyService from '../services/answerKeyService';
import NotificationBell from '../components/NotificationBell';
import {
  BookOpen,
  Plus,
  FileText,
  Calendar,
  Clock,
  User,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  RefreshCw,
  X,
  Upload,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Key,
  FileCheck,
} from 'lucide-react';

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation tab: 'list' | 'assigned' | 'create'
  const [activeTab, setActiveTab] = useState('list');

  // Question Papers state (Authored)
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [papersError, setPapersError] = useState('');

  // Assigned Question Papers state (Assigned to Authenticated Faculty - Module 12 & 15)
  const [assignedPapers, setAssignedPapers] = useState([]);
  const [loadingAssignedPapers, setLoadingAssignedPapers] = useState(false);
  const [assignedPapersError, setAssignedPapersError] = useState('');

  // In-app Action Notification Alert (replaces browser alerts)
  const [actionAlert, setActionAlert] = useState(null);

  // Digital Signature Verification state (Module 7)
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});

  // Eligible Recipients for dropdown
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    semester: 'Semester 5',
    academicYear: '2026-2027',
    examType: 'End Semester Examination',
    examDate: '',
    assignedToUserId: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Details Modal State
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Answer Key State (Module 10)
  const [answerKeyModalPaper, setAnswerKeyModalPaper] = useState(null);
  const [answerKeyData, setAnswerKeyData] = useState(null);
  const [loadingAnswerKey, setLoadingAnswerKey] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState('');
  const [answerKeySuccess, setAnswerKeySuccess] = useState('');
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [uploadingAnswerKey, setUploadingAnswerKey] = useState(false);
  const [downloadingAnswerKey, setDownloadingAnswerKey] = useState(false);
  const [verifyingAnswerKey, setVerifyingAnswerKey] = useState(false);
  const [answerKeyVerifyResult, setAnswerKeyVerifyResult] = useState(null);

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const loadAnswerKeyDetails = async (paperId) => {
    setLoadingAnswerKey(true);
    setAnswerKeyError('');
    try {
      const data = await answerKeyService.getTeacherAnswerKey(paperId);
      setAnswerKeyData(data);
    } catch (err) {
      setAnswerKeyError(err.response?.data?.message || err.message || 'Failed to load answer key details.');
    } finally {
      setLoadingAnswerKey(false);
    }
  };

  const handleOpenAnswerKeyModal = (paper) => {
    setAnswerKeyModalPaper(paper);
    setAnswerKeyData(null);
    setAnswerKeyError('');
    setAnswerKeySuccess('');
    setAnswerKeyFile(null);
    setAnswerKeyVerifyResult(null);
    loadAnswerKeyDetails(paper.id);
  };

  const handleUploadAnswerKey = async (e) => {
    e.preventDefault();
    if (!answerKeyFile) {
      setAnswerKeyError('Please select a PDF answer key file to upload.');
      return;
    }
    setUploadingAnswerKey(true);
    setAnswerKeyError('');
    setAnswerKeySuccess('');
    try {
      await answerKeyService.uploadTeacherAnswerKey(answerKeyModalPaper.id, answerKeyFile);
      setAnswerKeySuccess('Answer key encrypted and uploaded successfully with RSA-PSS digital signature!');
      setAnswerKeyFile(null);
      await loadAnswerKeyDetails(answerKeyModalPaper.id);
      fetchPapers();
    } catch (err) {
      setAnswerKeyError(err.response?.data?.message || err.message || 'Failed to upload answer key.');
    } finally {
      setUploadingAnswerKey(false);
    }
  };

  const handleDownloadAnswerKey = async () => {
    if (!answerKeyModalPaper) return;
    setDownloadingAnswerKey(true);
    setAnswerKeyError('');
    try {
      await answerKeyService.downloadTeacherAnswerKey(
        answerKeyModalPaper.id,
        answerKeyData?.fileName || `${answerKeyModalPaper.subject}_AnswerKey.pdf`
      );
    } catch (err) {
      setAnswerKeyError(err.response?.data?.message || err.message || 'Failed to download answer key.');
    } finally {
      setDownloadingAnswerKey(false);
    }
  };

  const handleVerifyAnswerKeySignature = async () => {
    if (!answerKeyModalPaper) return;
    setVerifyingAnswerKey(true);
    setAnswerKeyError('');
    try {
      const result = await answerKeyService.verifyTeacherAnswerKeySignature(answerKeyModalPaper.id);
      setAnswerKeyVerifyResult(result);
    } catch (err) {
      setAnswerKeyError(err.response?.data?.message || err.message || 'Signature verification failed.');
    } finally {
      setVerifyingAnswerKey(false);
    }
  };

  // Fetch Teacher's Question Papers
  const fetchPapers = useCallback(async () => {
    setLoadingPapers(true);
    setPapersError('');
    try {
      const data = await questionPaperService.getMyQuestionPapers();
      setPapers(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load question papers.';
      setPapersError(msg);
    } finally {
      setLoadingPapers(false);
    }
  }, []);

  // Fetch Question Papers Assigned to Authenticated Faculty (Module 12 & 15)
  const fetchAssignedPapers = useCallback(async () => {
    setLoadingAssignedPapers(true);
    setAssignedPapersError('');
    try {
      const data = await questionPaperService.getAssignedQuestionPapers();
      setAssignedPapers(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load assigned question papers.';
      setAssignedPapersError(msg);
    } finally {
      setLoadingAssignedPapers(false);
    }
  }, []);

  // Fetch Eligible Faculty Recipients
  const fetchRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      const list = await questionPaperService.getEligibleRecipients();
      setRecipients(list);
      // Default to first recipient if not set
      if (list && list.length > 0) {
        setFormData((prev) => (prev.assignedToUserId ? prev : { ...prev, assignedToUserId: list[0].id }));
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    fetchPapers();
    fetchAssignedPapers();
    fetchRecipients();
  }, [fetchPapers, fetchAssignedPapers, fetchRecipients]);

  // Form Field Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // File Change Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFormError('Invalid file type. Only PDF documents (.pdf) are permitted.');
      setSelectedFile(null);
      return;
    }

    const maxSizeMb = 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setFormError(`File size exceeds ${maxSizeMb} MB limit.`);
      setSelectedFile(null);
      return;
    }

    setFormError('');
    setSelectedFile(file);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (!formData.title.trim() || !formData.subject.trim() || !formData.examDate) {
      setFormError('Please fill in all required metadata fields.');
      return;
    }

    if (!formData.assignedToUserId) {
      setFormError('Please select a recipient faculty member.');
      return;
    }

    if (!selectedFile) {
      setFormError('Please select a valid question paper PDF file.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('subject', formData.subject.trim());
      payload.append('semester', formData.semester);
      payload.append('academicYear', formData.academicYear);
      payload.append('examType', formData.examType);
      payload.append('examDate', formData.examDate);
      payload.append('assignedToUserId', formData.assignedToUserId);
      payload.append('file', selectedFile);

      await questionPaperService.submitQuestionPaper(payload);

      setFormSuccess('Question paper submitted successfully! Next-day delivery has been scheduled.');
      // Reset form
      setFormData((prev) => ({
        ...prev,
        title: '',
        subject: '',
        examDate: '',
      }));
      setSelectedFile(null);

      // Refresh list and switch to list tab after short delay
      fetchPapers();
      setTimeout(() => {
        setActiveTab('list');
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit question paper.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Download Request (Module 6: Decrypted PDF Stream with Module 7 Verify-Before-Decrypt)
  const handleDownload = async (paperId, fileName = 'question_paper.pdf') => {
    setDownloadingId(paperId);
    setActionAlert(null);
    try {
      await questionPaperService.downloadQuestionPaper(paperId, fileName);
      setActionAlert({
        type: 'success',
        message: `Question paper "${fileName}" successfully decrypted and downloaded.`,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to download question paper.';
      setActionAlert({
        type: 'danger',
        message: `Download failed: ${msg}`,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Live Signature & Integrity Verification (Module 7)
  const handleVerifySignature = async (paperId) => {
    setVerifyingId(paperId);
    setActionAlert(null);
    try {
      const res = await questionPaperService.verifySignature(paperId);
      setVerificationResults((prev) => ({
        ...prev,
        [paperId]: {
          verified: res.verified,
          tamperDetected: res.tamperDetected,
          algorithm: res.algorithm,
          fileHash: res.fileHash,
          checkedAt: new Date().toLocaleTimeString(),
        },
      }));
      if (res.verified) {
        setActionAlert({
          type: 'success',
          message: `Integrity check PASSED: Ciphertext hash matches RSA-PSS signature (${res.algorithm || 'RSA-PSS-SHA256'}).`,
        });
      } else {
        setActionAlert({
          type: 'danger',
          message: 'CRITICAL SECURITY ALERT: Digital signature or ciphertext hash verification failed! Document may be tampered.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification check failed';
      setVerificationResults((prev) => ({
        ...prev,
        [paperId]: {
          verified: false,
          tamperDetected: true,
          error: msg,
          checkedAt: new Date().toLocaleTimeString(),
        },
      }));
      setActionAlert({
        type: 'danger',
        message: `Verification error: ${msg}`,
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Filtered Papers (Authored)
  const filteredPapers = papers.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.subject?.toLowerCase().includes(q) ||
      p.exam_type?.toLowerCase().includes(q)
    );
  });

  // Filtered Assigned Papers (Assigned to Me)
  const filteredAssignedPapers = assignedPapers.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.subject?.toLowerCase().includes(q) ||
      p.examType?.toLowerCase().includes(q) ||
      p.teacher?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.brandIcon}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>ExamGuard</h1>
            <span style={styles.brandTagline}>Teacher Workspace • Question Paper Management</span>
          </div>
        </div>

        <div style={styles.navUserSection}>
          <NotificationBell onSelectPaper={(p) => setSelectedPaper(p)} />
          <div style={styles.userBadge}>
            <User size={16} color="#94a3b8" />
            <div>
              <div style={styles.userName}>{user?.name || 'Faculty Member'}</div>
              <div style={styles.userRole}>ROLE: {user?.role || 'TEACHER'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={styles.main}>
        {/* Global Action Alert */}
        {actionAlert && (
          <div
            style={{
              ...(actionAlert.type === 'success' ? styles.alertSuccess : styles.alertError),
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {actionAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionAlert.message}</span>
            </div>
            <button
              onClick={() => setActionAlert(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.2rem' }}
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Workspace Tab Bar */}
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab('list')}
            style={activeTab === 'list' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          >
            <Layers size={18} />
            <span>My Question Papers</span>
            <span style={styles.counterBadge}>{papers.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            style={activeTab === 'assigned' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          >
            <FileCheck size={18} />
            <span>Assigned to Me</span>
            <span style={styles.counterBadge}>{assignedPapers.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            style={activeTab === 'create' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          >
            <Plus size={18} />
            <span>Create Question Paper</span>
          </button>
        </div>

        {/* TAB 1: LIST QUESTION PAPERS */}
        {activeTab === 'list' && (
          <div style={styles.tabContent}>
            {/* Header / Stats Banner */}
            <div style={styles.statsBanner}>
              <div>
                <h2 style={styles.sectionHeading}>Authored Question Papers</h2>
                <p style={styles.sectionSubtitle}>
                  View and manage all examination question papers created by your account.
                </p>
              </div>

              <div style={styles.bannerActions}>
                <button onClick={fetchPapers} style={styles.refreshBtn} title="Refresh Papers List">
                  <RefreshCw size={16} className={loadingPapers ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button onClick={() => setActiveTab('create')} style={styles.primaryAddBtn}>
                  <Plus size={16} />
                  <span>New Paper</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={styles.searchBarWrapper}>
              <input
                type="text"
                placeholder="Search by subject, title, or exam type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Error Alert */}
            {papersError && (
              <div style={styles.alertError}>
                <AlertCircle size={18} />
                <span>{papersError}</span>
              </div>
            )}

            {/* Loading State */}
            {loadingPapers ? (
              <div style={styles.loadingContainer}>
                <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading question papers from Supabase...</span>
              </div>
            ) : filteredPapers.length === 0 ? (
              /* Empty State */
              <div style={styles.emptyState}>
                <FileText size={48} color="#64748b" />
                <h3 style={styles.emptyTitle}>No Question Papers Found</h3>
                <p style={styles.emptySubtitle}>
                  {searchTerm
                    ? 'No question papers match your search criteria.'
                    : 'You have not submitted any question papers yet.'}
                </p>
                {!searchTerm && (
                  <button onClick={() => setActiveTab('create')} style={styles.emptyActionBtn}>
                    <Plus size={16} />
                    <span>Create Your First Question Paper</span>
                  </button>
                )}
              </div>
            ) : (
              /* Paper Cards Grid */
              <div style={styles.papersGrid}>
                {filteredPapers.map((paper) => {
                  const assignment = paper.question_paper_assignments?.[0];
                  const recipient = assignment?.recipient;

                  return (
                    <div key={paper.id} style={styles.paperCard}>
                      <div style={styles.cardHeader}>
                        <div style={styles.subjectPill}>{paper.subject}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={styles.signatureBadge} title="RSA-PSS SHA-256 Digital Signature Verified">
                            <ShieldCheck size={11} color="#34d399" />
                            <span>Signature Verified</span>
                          </span>
                          <span style={styles.statusBadge}>{paper.status}</span>
                        </div>
                      </div>

                      <h3 style={styles.paperTitle}>{paper.title}</h3>

                      <div style={styles.metaRows}>
                        <div style={styles.metaRow}>
                          <Calendar size={14} color="#94a3b8" />
                          <span>
                            <strong>Exam Date:</strong> {paper.exam_date}
                          </span>
                        </div>

                        <div style={styles.metaRow}>
                          <Clock size={14} color="#94a3b8" />
                          <span>
                            <strong>Submitted:</strong>{' '}
                            {paper.submitted_at ? new Date(paper.submitted_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <div style={styles.deliveryRow}>
                          <Clock size={14} color="#38bdf8" />
                          <span>
                            <strong>Next-Day Delivery:</strong>{' '}
                            <span style={styles.deliveryDateHighlight}>
                              {paper.scheduled_delivery_date || assignment?.scheduled_delivery_date || 'N/A'}
                            </span>
                          </span>
                        </div>

                        <div style={styles.metaRow}>
                          <User size={14} color="#94a3b8" />
                          <span>
                            <strong>Assigned Faculty:</strong>{' '}
                            {recipient ? `${recipient.name} (${recipient.email})` : 'Assigned Faculty'}
                          </span>
                        </div>
                      </div>

                      {verificationResults[paper.id] && (
                        <div
                          style={
                            verificationResults[paper.id].verified
                              ? styles.verificationSuccessAlert
                              : styles.verificationFailureAlert
                          }
                        >
                          {verificationResults[paper.id].verified ? (
                            <span>✔ RSA-PSS Signature Verified Valid</span>
                          ) : (
                            <span>✖ Signature/Integrity Check Failed</span>
                          )}
                        </div>
                      )}

                      <div style={styles.cardFooter}>
                        <span style={styles.fileInfoText}>
                          PDF • {(paper.file_size / 1024).toFixed(1)} KB
                        </span>

                        <div style={styles.cardBtnGroup}>
                          <button
                            onClick={() => handleVerifySignature(paper.id)}
                            disabled={verifyingId === paper.id}
                            style={styles.verifyCardBtn}
                            title="Verify RSA-PSS Signature & Integrity"
                          >
                            {verifyingId === paper.id ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <ShieldCheck size={13} />
                            )}
                            <span>Verify</span>
                          </button>

                          <button
                            onClick={() => handleOpenAnswerKeyModal(paper)}
                            style={styles.answerKeyCardBtn}
                            title="Manage Answer Key"
                          >
                            <Key size={13} />
                            <span>Answer Key</span>
                          </button>

                          <button
                            onClick={() => setSelectedPaper(paper)}
                            style={styles.viewBtn}
                            title="View Full Metadata"
                          >
                            <Eye size={15} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handleDownload(paper.id, paper.file_name)}
                            disabled={downloadingId === paper.id || verificationResults[paper.id]?.tamperDetected}
                            style={{
                              ...styles.downloadBtn,
                              ...(verificationResults[paper.id]?.tamperDetected
                                ? { backgroundColor: '#475569', opacity: 0.5, cursor: 'not-allowed' }
                                : {}),
                            }}
                            title={
                              verificationResults[paper.id]?.tamperDetected
                                ? 'Integrity check failed: download blocked'
                                : 'Download Decrypted PDF'
                            }
                          >
                            {downloadingId === paper.id ? (
                              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Download size={15} />
                            )}
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNED QUESTION PAPERS */}
        {activeTab === 'assigned' && (
          <div style={styles.tabContent}>
            {/* Header / Stats Banner */}
            <div style={styles.statsBanner}>
              <div>
                <h2 style={styles.sectionHeading}>Question Papers Assigned to Me</h2>
                <p style={styles.sectionSubtitle}>
                  Examination question papers designated to you by colleague faculty members. Next-day delivery gating is strictly enforced.
                </p>
              </div>

              <div style={styles.bannerActions}>
                <button onClick={fetchAssignedPapers} style={styles.refreshBtn} title="Refresh Assigned Papers List">
                  <RefreshCw size={16} className={loadingAssignedPapers ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={styles.searchBarWrapper}>
              <input
                type="text"
                placeholder="Search assigned papers by subject, title, setter faculty, or exam type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Error Alert */}
            {assignedPapersError && (
              <div style={styles.alertError}>
                <AlertCircle size={18} />
                <span>{assignedPapersError}</span>
              </div>
            )}

            {/* Loading State */}
            {loadingAssignedPapers ? (
              <div style={styles.loadingContainer}>
                <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading assigned question papers...</span>
              </div>
            ) : filteredAssignedPapers.length === 0 ? (
              /* Empty State */
              <div style={styles.emptyState}>
                <FileCheck size={48} color="#64748b" />
                <h3 style={styles.emptyTitle}>No Assigned Question Papers Found</h3>
                <p style={styles.emptySubtitle}>
                  {searchTerm
                    ? 'No assigned question papers match your search criteria.'
                    : 'You have not been assigned any question papers by other faculty members yet.'}
                </p>
              </div>
            ) : (
              /* Paper Cards Grid */
              <div style={styles.papersGrid}>
                {filteredAssignedPapers.map((paper) => {
                  const isDeliverable = paper.isDeliverable;
                  const isTampered = verificationResults[paper.id]?.tamperDetected;

                  return (
                    <div key={paper.id} style={styles.paperCard}>
                      <div style={styles.cardHeader}>
                        <div style={styles.subjectPill}>{paper.subject}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              backgroundColor: isDeliverable
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(234, 179, 8, 0.15)',
                              color: isDeliverable ? '#4ade80' : '#facc15',
                              border: isDeliverable
                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                : '1px solid rgba(234, 179, 8, 0.3)',
                            }}
                          >
                            {isDeliverable ? '✔ Delivered' : '⏳ Delivery Gated'}
                          </span>
                          <span style={styles.statusBadge}>{paper.status}</span>
                        </div>
                      </div>

                      <h3 style={styles.paperTitle}>{paper.title}</h3>

                      <div style={styles.metaRows}>
                        <div style={styles.metaRow}>
                          <User size={14} color="#94a3b8" />
                          <span>
                            <strong>Setter Faculty:</strong>{' '}
                            {paper.teacher ? `${paper.teacher.name} (${paper.teacher.email})` : 'Faculty Member'}
                          </span>
                        </div>

                        <div style={styles.metaRow}>
                          <Calendar size={14} color="#94a3b8" />
                          <span>
                            <strong>Exam Date:</strong> {paper.examDate}
                          </span>
                        </div>

                        <div style={styles.deliveryRow}>
                          <Clock size={14} color={isDeliverable ? '#4ade80' : '#f59e0b'} />
                          <span>
                            <strong>Next-Day Delivery:</strong>{' '}
                            <span style={{ color: isDeliverable ? '#4ade80' : '#facc15', fontWeight: '600' }}>
                              {paper.scheduledDeliveryDate}
                            </span>
                          </span>
                        </div>

                        <div style={styles.metaRow}>
                          <span style={{ fontSize: '0.75rem', color: isDeliverable ? '#86efac' : '#fde047' }}>
                            {isDeliverable
                              ? 'Access Authorized • Ready for verification and download'
                              : `Access Restricted • Unlocks on ${paper.scheduledDeliveryDate}`}
                          </span>
                        </div>
                      </div>

                      {verificationResults[paper.id] && (
                        <div
                          style={
                            verificationResults[paper.id].verified
                              ? styles.verificationSuccessAlert
                              : styles.verificationFailureAlert
                          }
                        >
                          {verificationResults[paper.id].verified ? (
                            <span>✔ RSA-PSS Signature Verified Valid</span>
                          ) : (
                            <span>✖ Signature/Integrity Check Failed</span>
                          )}
                        </div>
                      )}

                      <div style={styles.cardFooter}>
                        <span style={styles.fileInfoText}>
                          PDF • {paper.fileSize ? (paper.fileSize / 1024).toFixed(1) : '—'} KB
                        </span>

                        <div style={styles.cardBtnGroup}>
                          <button
                            onClick={() => handleVerifySignature(paper.id)}
                            disabled={verifyingId === paper.id}
                            style={styles.verifyCardBtn}
                            title="Verify RSA-PSS Signature & Integrity"
                          >
                            {verifyingId === paper.id ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <ShieldCheck size={13} />
                            )}
                            <span>Verify</span>
                          </button>

                          <button
                            onClick={() => setSelectedPaper(paper)}
                            style={styles.viewBtn}
                            title="View Metadata"
                          >
                            <Eye size={15} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handleDownload(paper.id, paper.fileName)}
                            disabled={downloadingId === paper.id || isTampered || !isDeliverable}
                            style={{
                              ...styles.downloadBtn,
                              ...(!isDeliverable
                                ? { backgroundColor: '#334155', opacity: 0.5, cursor: 'not-allowed' }
                                : isTampered
                                ? { backgroundColor: '#475569', opacity: 0.5, cursor: 'not-allowed' }
                                : {}),
                            }}
                            title={
                              !isDeliverable
                                ? `Access restricted until delivery date (${paper.scheduledDeliveryDate})`
                                : isTampered
                                ? 'Integrity check failed: download blocked'
                                : 'Download Decrypted PDF'
                            }
                          >
                            {downloadingId === paper.id ? (
                              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Download size={15} />
                            )}
                            <span>{!isDeliverable ? 'Delivery Gated' : isTampered ? 'Tamper Blocked' : 'Download'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREATE QUESTION PAPER FORM */}
        {activeTab === 'create' && (
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h2 style={styles.sectionHeading}>Submit Question Paper</h2>
              <p style={styles.sectionSubtitle}>
                Upload an official examination paper PDF, specify subject metadata, and designate the faculty recipient.
              </p>
            </div>

            {/* Error and Success Alerts */}
            {formError && (
              <div style={styles.alertError}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div style={styles.alertSuccess}>
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                {/* Title */}
                <div style={styles.formGroupSpan2}>
                  <label style={styles.label} htmlFor="title">
                    Question Paper Title <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g. End Semester Examination - Nov 2026"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    style={styles.input}
                  />
                </div>

                {/* Subject */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="subject">
                    Subject Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="e.g. Database Management Systems"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    style={styles.input}
                  />
                </div>

                {/* Exam Date */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="examDate">
                    Examination Date <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="examDate"
                    name="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    style={styles.input}
                  />
                </div>

                {/* Semester */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="semester">
                    Semester <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    disabled={submitting}
                    style={styles.select}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>

                {/* Academic Year */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="academicYear">
                    Academic Year <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="academicYear"
                    name="academicYear"
                    type="text"
                    placeholder="e.g. 2026-2027"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    style={styles.input}
                  />
                </div>

                {/* Exam Type */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="examType">
                    Examination Type <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="examType"
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    disabled={submitting}
                    style={styles.select}
                  >
                    <option value="End Semester Examination">End Semester Examination</option>
                    <option value="Mid Term Examination">Mid Term Examination</option>
                    <option value="Supplementary Examination">Supplementary Examination</option>
                    <option value="Class Assessment">Class Assessment</option>
                  </select>
                </div>

                {/* Assigned Recipient Faculty */}
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="assignedToUserId">
                    Assigned Recipient Faculty <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="assignedToUserId"
                    name="assignedToUserId"
                    value={formData.assignedToUserId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || loadingRecipients}
                    style={styles.select}
                  >
                    {recipients.length === 0 ? (
                      <option value="">No other faculty members found</option>
                    ) : (
                      recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* PDF File Upload Zone */}
              <div style={styles.fileUploadSection}>
                <label style={styles.label}>
                  Question Paper Document (PDF Only, Max 10 MB) <span style={styles.required}>*</span>
                </label>
                <div style={styles.fileDropZone}>
                  <Upload size={32} color="#3b82f6" />
                  <div style={styles.dropZoneText}>
                    {selectedFile ? (
                      <div>
                        <span style={styles.selectedFileName}>{selectedFile.name}</span>
                        <span style={styles.selectedFileSize}>
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ) : (
                      <>
                        <span style={styles.dropPrompt}>Click to browse or drag PDF here</span>
                        <span style={styles.dropSubPrompt}>Only valid .pdf files with valid PDF headers</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={submitting}
                    style={styles.fileInputHidden}
                  />
                </div>
              </div>

              {/* System Calculation Info Callout */}
              <div style={styles.infoCallout}>
                <Clock size={18} color="#38bdf8" />
                <div style={styles.calloutText}>
                  <strong>Automated Scheduling:</strong> Upon submission, the server will timestamp this paper and automatically calculate the <strong>Next-Day Delivery Date</strong> (Submission Date + 1 Day). The file is stored in a private Supabase Storage bucket.
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  disabled={submitting}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={submitting ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
                >
                  {submitting ? (
                    <span style={styles.btnLoadingContent}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Uploading &amp; Submitting...
                    </span>
                  ) : (
                    'Submit Question Paper'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* QUESTION PAPER DETAILS MODAL */}
      {selectedPaper && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalBadge}>{selectedPaper.status}</span>
                <h3 style={styles.modalTitle}>{selectedPaper.title}</h3>
                <span style={styles.modalSubject}>{selectedPaper.subject}</span>
              </div>
              <button onClick={() => setSelectedPaper(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Semester</span>
                  <span style={styles.detailValue}>{selectedPaper.semester || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Academic Year</span>
                  <span style={styles.detailValue}>{selectedPaper.academic_year || selectedPaper.academicYear || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Exam Type</span>
                  <span style={styles.detailValue}>{selectedPaper.exam_type || selectedPaper.examType || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Exam Date</span>
                  <span style={styles.detailValue}>{selectedPaper.exam_date || selectedPaper.examDate || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Submitted At</span>
                  <span style={styles.detailValue}>
                    {(selectedPaper.submitted_at || selectedPaper.submittedAt)
                      ? new Date(selectedPaper.submitted_at || selectedPaper.submittedAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Scheduled Delivery</span>
                  <span style={{ ...styles.detailValue, color: '#38bdf8' }}>
                    {selectedPaper.scheduled_delivery_date || selectedPaper.scheduledDeliveryDate || 'N/A'}
                  </span>
                </div>
              </div>

              <div style={styles.storageBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={styles.storageBoxLabel}>Private Storage &amp; Key Management</span>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                    Envelope Encryption
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div><strong style={{ color: '#cbd5e1' }}>Cipher:</strong> AES-256-GCM</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Key Wrap:</strong> RSA-OAEP (SHA-256)</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Storage:</strong> Private Bucket</div>
                </div>
                <code style={styles.storageCode}>{selectedPaper.file_name || selectedPaper.fileName} • Protected Storage (Encrypted at Rest)</code>
              </div>

              {selectedPaper.teacher && (
                <div style={styles.recipientBox}>
                  <span style={styles.detailLabel}>Authoring / Setter Faculty</span>
                  <span style={styles.detailValue}>
                    {selectedPaper.teacher.name} ({selectedPaper.teacher.email})
                  </span>
                </div>
              )}

              {selectedPaper.question_paper_assignments?.[0] && (
                <div style={styles.recipientBox}>
                  <span style={styles.detailLabel}>Assigned Recipient Faculty</span>
                  <span style={styles.detailValue}>
                    {selectedPaper.question_paper_assignments[0].recipient?.name} (
                    {selectedPaper.question_paper_assignments[0].recipient?.email})
                  </span>
                  <span style={styles.assignmentStatusBadge}>
                    Delivery Status: {selectedPaper.question_paper_assignments[0].delivery_status}
                  </span>
                </div>
              )}

              {/* Digital Signature & Cryptographic Integrity Panel (Module 7) */}
              <div style={styles.signatureBox}>
                <div style={styles.signatureBoxHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} color="#34d399" />
                    <span style={styles.signatureBoxTitle}>Digital Signature &amp; Integrity</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifySignature(selectedPaper.id)}
                    disabled={verifyingId === selectedPaper.id}
                    style={styles.modalVerifyBtn}
                  >
                    {verifyingId === selectedPaper.id ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <ShieldCheck size={13} />
                    )}
                    <span>Verify Signature</span>
                  </button>
                </div>

                <div style={styles.signatureDetailGrid}>
                  <div>
                    <span style={styles.detailLabel}>Algorithm:</span>{' '}
                    <span style={styles.signatureDetailValue}>
                      {selectedPaper.digital_signatures?.[0]?.algorithm || 'RSA-PSS-SHA256'}
                    </span>
                  </div>
                  <div>
                    <span style={styles.detailLabel}>Status:</span>{' '}
                    <span style={{ ...styles.signatureDetailValue, color: '#34d399' }}>
                      Cryptographically Signed
                    </span>
                  </div>
                </div>

                {verificationResults[selectedPaper.id] && (
                  <div
                    style={
                      verificationResults[selectedPaper.id].verified
                        ? styles.verificationSuccessAlert
                        : styles.verificationFailureAlert
                    }
                  >
                    {verificationResults[selectedPaper.id].verified ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={15} color="#34d399" />
                        <span>
                          <strong>Verified Authentic:</strong> RSA-PSS digital signature and SHA-256 hash valid at {verificationResults[selectedPaper.id].checkedAt}.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldAlert size={15} color="#f87171" />
                        <span>
                          <strong>Integrity Alert:</strong> {verificationResults[selectedPaper.id].error || 'Ciphertext verification failed.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              {(() => {
                const isDeliverable = selectedPaper.isDeliverable !== undefined ? selectedPaper.isDeliverable : true;
                const isTampered = verificationResults[selectedPaper.id]?.tamperDetected;
                const isDisabled = downloadingId === selectedPaper.id || isTampered || !isDeliverable;

                return (
                  <button
                    onClick={() => handleDownload(selectedPaper.id, selectedPaper.file_name || selectedPaper.fileName)}
                    disabled={isDisabled}
                    style={{
                      ...styles.modalDownloadBtn,
                      ...(!isDeliverable
                        ? { backgroundColor: '#334155', opacity: 0.5, cursor: 'not-allowed' }
                        : isTampered
                        ? { backgroundColor: '#475569', opacity: 0.5, cursor: 'not-allowed' }
                        : {}),
                    }}
                    title={
                      !isDeliverable
                        ? `Delivery Gated: Access restricted until ${selectedPaper.scheduled_delivery_date || selectedPaper.scheduledDeliveryDate}`
                        : isTampered
                        ? 'Integrity check failed: download blocked'
                        : 'Download Secure PDF'
                    }
                  >
                    {downloadingId === selectedPaper.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>
                      {!isDeliverable
                        ? `Delivery Gated • Unlocks ${selectedPaper.scheduled_delivery_date || selectedPaper.scheduledDeliveryDate}`
                        : isTampered
                        ? 'Verification Failed • Download Disabled'
                        : 'Download Secure PDF'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ANSWER KEY MODAL (Module 10) */}
      {answerKeyModalPaper && (
        <div style={styles.modalOverlay} onClick={() => setAnswerKeyModalPaper(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Key size={18} color="#a855f7" />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Module 10 • Post-Exam Answer Key
                  </span>
                </div>
                <h3 style={styles.modalTitle}>{answerKeyModalPaper.title}</h3>
                <span style={styles.modalSubject}>{answerKeyModalPaper.subject}</span>
              </div>
              <button onClick={() => setAnswerKeyModalPaper(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingAnswerKey ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                  <p>Retrieving answer key status and timing windows...</p>
                </div>
              ) : (
                <>
                  {/* Submission Window Status Banner */}
                  {answerKeyData?.submissionWindow && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: answerKeyData.submissionWindow.canUpload
                        ? (answerKeyData.submissionWindow.daysSinceExam <= 2 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)')
                        : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${
                        answerKeyData.submissionWindow.canUpload
                          ? (answerKeyData.submissionWindow.daysSinceExam <= 2 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)')
                          : 'rgba(239, 68, 68, 0.3)'
                      }`,
                      marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                          Timing Window Status
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          backgroundColor: answerKeyData.submissionWindow.canUpload
                            ? (answerKeyData.submissionWindow.daysSinceExam <= 2 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)')
                            : 'rgba(239, 68, 68, 0.2)',
                          color: answerKeyData.submissionWindow.canUpload
                            ? (answerKeyData.submissionWindow.daysSinceExam <= 2 ? '#4ade80' : '#facc15')
                            : '#f87171',
                        }}>
                          {answerKeyData.submissionWindow.status}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                        {answerKeyData.submissionWindow.message}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <div><strong>Exam Date:</strong> {answerKeyData.submissionWindow.examDate}</div>
                        <div><strong>Preferred (0–2d):</strong> {answerKeyData.submissionWindow.preferredDeadline}</div>
                        <div><strong>Max Cutoff (4d):</strong> {answerKeyData.submissionWindow.maxDeadline}</div>
                      </div>
                    </div>
                  )}

                  {/* Error & Success Alerts */}
                  {answerKeyError && (
                    <div style={{ ...styles.alertError, marginBottom: '1rem' }}>
                      <AlertCircle size={18} />
                      <span>{answerKeyError}</span>
                    </div>
                  )}

                  {answerKeySuccess && (
                    <div style={{ ...styles.alertSuccess, marginBottom: '1rem' }}>
                      <CheckCircle2 size={18} />
                      <span>{answerKeySuccess}</span>
                    </div>
                  )}

                  {/* IF ANSWER KEY ALREADY SUBMITTED */}
                  {answerKeyData?.submitted ? (
                    <div>
                      <div style={{ ...styles.detailGrid, marginBottom: '1rem' }}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>File Name</span>
                          <span style={styles.detailValue}>{answerKeyData.fileName}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>File Size</span>
                          <span style={styles.detailValue}>{(answerKeyData.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Submitted At</span>
                          <span style={styles.detailValue}>{new Date(answerKeyData.uploadedAt).toLocaleString()}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Status</span>
                          <span style={{ ...styles.detailValue, color: '#4ade80' }}>{answerKeyData.status}</span>
                        </div>
                      </div>

                      {/* Cryptographic Protection Panel */}
                      <div style={{ ...styles.storageBox, marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={styles.storageBoxLabel}>Answer Key Cryptographic Envelope</span>
                          <span style={{ fontSize: '0.72rem', color: '#c084fc', backgroundColor: 'rgba(192, 132, 252, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                            AES-256-GCM + RSA-OAEP
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                          <div><strong style={{ color: '#cbd5e1' }}>Algorithm:</strong> {answerKeyData.digitalSignature?.algorithm || 'RSA-PSS-SHA256'}</div>
                          <div><strong style={{ color: '#cbd5e1' }}>Storage:</strong> Private Bucket</div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <strong style={{ color: '#cbd5e1' }}>Ciphertext Digest:</strong>{' '}
                            <code style={{ fontSize: '0.7rem', color: '#93c5fd' }}>{answerKeyData.digitalSignature?.fileHash || 'Protected'}</code>
                          </div>
                        </div>
                      </div>

                      {/* Verification Results Panel */}
                      {answerKeyVerifyResult && (
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          backgroundColor: answerKeyVerifyResult.verified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${answerKeyVerifyResult.verified ? '#22c55e' : '#ef4444'}`,
                          color: answerKeyVerifyResult.verified ? '#86efac' : '#fca5a5',
                          fontSize: '0.825rem',
                        }}>
                          {answerKeyVerifyResult.verified ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <CheckCircle2 size={16} color="#22c55e" />
                              <span><strong>RSA-PSS Digital Signature Verified:</strong> Ciphertext integrity is untampered.</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <ShieldAlert size={16} color="#ef4444" />
                              <span><strong>Verification Failed:</strong> Integrity hash mismatch or invalid signature!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* IF NOT SUBMITTED YET */
                    <div>
                      {answerKeyData?.submissionWindow?.canUpload ? (
                        <form onSubmit={handleUploadAnswerKey}>
                          <div style={{ ...styles.fileUploadSection, marginBottom: '1rem' }}>
                            <label style={styles.label}>
                              Upload Answer Key Document (PDF Only, Max 10 MB) <span style={styles.required}>*</span>
                            </label>
                            <div style={styles.fileDropZone}>
                              <Upload size={28} color="#a855f7" />
                              <div style={styles.dropZoneText}>
                                {answerKeyFile ? (
                                  <div>
                                    <span style={{ ...styles.selectedFileName, color: '#c084fc' }}>{answerKeyFile.name}</span>
                                    <span style={styles.selectedFileSize}>
                                      ({(answerKeyFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <span style={styles.dropPrompt}>Click to browse or drag Answer Key PDF here</span>
                                    <span style={styles.dropSubPrompt}>Must be a valid PDF matching this paper's solutions</span>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                                disabled={uploadingAnswerKey}
                                style={styles.fileInputHidden}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                              type="submit"
                              disabled={uploadingAnswerKey || !answerKeyFile}
                              style={{
                                ...styles.submitBtn,
                                backgroundColor: '#9333ea',
                                opacity: uploadingAnswerKey || !answerKeyFile ? 0.6 : 1,
                              }}
                            >
                              {uploadingAnswerKey ? (
                                <span style={styles.btnLoadingContent}>
                                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                  Encrypting &amp; Signing...
                                </span>
                              ) : (
                                'Submit & Encrypt Answer Key'
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div style={{
                          padding: '1.25rem',
                          textAlign: 'center',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          fontSize: '0.85rem',
                        }}>
                          <AlertCircle size={28} color="#f87171" style={{ margin: '0 auto 0.5rem' }} />
                          <p style={{ margin: 0, fontWeight: '500' }}>
                            {answerKeyData?.submissionWindow?.status === 'BEFORE_EXAM'
                              ? 'Answer keys cannot be submitted before the exam date. Please return on or after the scheduled exam date.'
                              : 'The 4-day post-exam submission window has closed. Submission is no longer accepted.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer with Actions */}
            {answerKeyData?.submitted && (
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleVerifyAnswerKeySignature}
                  disabled={verifyingAnswerKey}
                  style={styles.modalVerifyBtn}
                >
                  {verifyingAnswerKey ? (
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  <span>Verify Signature</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAnswerKey}
                  disabled={downloadingAnswerKey || answerKeyVerifyResult?.tamperDetected}
                  style={{
                    ...styles.modalDownloadBtn,
                    backgroundColor: answerKeyVerifyResult?.tamperDetected ? '#475569' : '#9333ea',
                    ...(answerKeyVerifyResult?.tamperDetected ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                  }}
                  title={
                    answerKeyVerifyResult?.tamperDetected
                      ? 'Integrity check failed: download blocked'
                      : 'Download Decrypted PDF'
                  }
                >
                  {downloadingAnswerKey ? (
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Download size={15} />
                  )}
                  <span>
                    {answerKeyVerifyResult?.tamperDetected
                      ? 'Verification Failed • Download Disabled'
                      : 'Download Decrypted PDF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0b1120',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  navbar: {
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    padding: '0.875rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandIcon: {
    padding: '0.5rem',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0,
  },
  brandTagline: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  navUserSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1e293b',
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  userName: {
    fontSize: '0.825rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  userRole: {
    fontSize: '0.7rem',
    color: '#38bdf8',
    fontWeight: '500',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#1e293b',
    color: '#f87171',
    border: '1px solid #334155',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  tabBar: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid #1e293b',
    marginBottom: '2rem',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
    fontWeight: '600',
  },
  counterBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    padding: '0.15rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  statsBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionHeading: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 0.25rem 0',
  },
  sectionSubtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  bannerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    padding: '0.5rem 0.875rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  primaryAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  searchBarWrapper: {
    width: '100%',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#86efac',
    fontSize: '0.875rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '4rem 1rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px dashed #334155',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: '1rem',
    marginBottom: '0.25rem',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginBottom: '1.25rem',
  },
  emptyActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  papersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },
  paperCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectPill: {
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    padding: '0.2rem 0.5rem',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
  },
  paperTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f8fafc',
    margin: 0,
    lineHeight: '1.35',
  },
  metaRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: '#cbd5e1',
    backgroundColor: '#0b1120',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #1e293b',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  deliveryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#38bdf8',
  },
  deliveryDateHighlight: {
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.5rem',
    borderTop: '1px solid #1e293b',
  },
  fileInfoText: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  cardBtnGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  answerKeyCardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    border: '1px solid #a855f7',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    color: '#d8b4fe',
    fontSize: '0.775rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formContainer: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '850px',
    margin: '0 auto',
  },
  formHeader: {
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  formGroupSpan2: {
    gridColumn: 'span 2',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    padding: '0.65rem 0.85rem',
    backgroundColor: '#0b1120',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.85rem',
    outline: 'none',
  },
  select: {
    padding: '0.65rem 0.85rem',
    backgroundColor: '#0b1120',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.85rem',
    outline: 'none',
  },
  fileUploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  fileDropZone: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    backgroundColor: '#0b1120',
    border: '2px dashed #334155',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  dropZoneText: {
    marginTop: '0.5rem',
  },
  dropPrompt: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  dropSubPrompt: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.2rem',
  },
  selectedFileName: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#38bdf8',
  },
  selectedFileSize: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  fileInputHidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  infoCallout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '8px',
    padding: '0.875rem 1rem',
  },
  calloutText: {
    fontSize: '0.8rem',
    color: '#bae6fd',
    lineHeight: '1.45',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid #1e293b',
  },
  cancelBtn: {
    padding: '0.65rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '0.65rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnLoadingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalBadge: {
    display: 'inline-block',
    fontSize: '0.65rem',
    fontWeight: '700',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    padding: '0.15rem 0.45rem',
    borderRadius: '9999px',
    marginBottom: '0.35rem',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0,
  },
  modalSubject: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  detailItem: {
    backgroundColor: '#0b1120',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #1e293b',
  },
  detailLabel: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '0.85rem',
    color: '#f8fafc',
    fontWeight: '500',
  },
  storageBox: {
    backgroundColor: '#0b1120',
    border: '1px solid #1e293b',
    padding: '0.75rem',
    borderRadius: '8px',
  },
  storageBoxLabel: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
  },
  storageCode: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#38bdf8',
    wordBreak: 'break-all',
  },
  recipientBox: {
    backgroundColor: '#0b1120',
    border: '1px solid #1e293b',
    padding: '0.75rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  assignmentStatusBadge: {
    fontSize: '0.7rem',
    color: '#38bdf8',
    fontWeight: '500',
    marginTop: '0.25rem',
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalDownloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  signatureBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.65rem',
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    padding: '0.15rem 0.45rem',
    borderRadius: '9999px',
  },
  verifyCardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#1e293b',
    color: '#34d399',
    border: '1px solid #334155',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  signatureBox: {
    backgroundColor: '#0b1120',
    border: '1px solid #1e293b',
    padding: '0.875rem',
    borderRadius: '8px',
  },
  signatureBoxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  signatureBoxTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  modalVerifyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    backgroundColor: '#064e3b',
    color: '#34d399',
    border: '1px solid #047857',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  signatureDetailGrid: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  signatureDetailValue: {
    color: '#f8fafc',
    fontWeight: '500',
  },
  verificationSuccessAlert: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '0.75rem',
  },
  verificationFailureAlert: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    fontSize: '0.75rem',
  },
};

