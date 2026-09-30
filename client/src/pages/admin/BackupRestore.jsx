import React, { useState, useEffect } from 'react';
import { backupService } from '../../services/api';
import Button from '../../components/Button';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Loading from '../../components/Loading';
import {
  DatabaseBackup,
  Download,
  RotateCcw,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileJson,
  ShieldAlert
} from 'lucide-react';

const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Restore Dialog
  const [restoreFilename, setRestoreFilename] = useState(null);

  // Delete Dialog
  const [deleteFilename, setDeleteFilename] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await backupService.listBackups();
      if (res.success) {
        setBackups(res.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Create Snapshot
  const handleCreateBackup = async () => {
    setCreating(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await backupService.createBackup();
      if (res.success) {
        setSuccessMsg(`Database snapshot created: ${res.backup.filename} (${res.backup.sizeFormatted})`);
        await fetchBackups();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create database backup.');
    } finally {
      setCreating(false);
    }
  };

  // Restore Snapshot
  const handleConfirmRestore = async () => {
    if (!restoreFilename) return;
    setRestoring(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await backupService.restoreBackup(restoreFilename);
      if (res.success) {
        setSuccessMsg(res.message || 'Database snapshot restored successfully.');
        setRestoreFilename(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to restore database from backup.');
    } finally {
      setRestoring(false);
    }
  };

  // Delete Snapshot
  const handleConfirmDelete = async () => {
    if (!deleteFilename) return;
    setIsDeleting(true);

    try {
      const res = await backupService.deleteBackup(deleteFilename);
      if (res.success) {
        setDeleteFilename(null);
        await fetchBackups();
      }
    } catch (err) {
      alert(err.message || 'Could not delete backup file.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <DatabaseBackup className="w-5 h-5 text-[#800020]" />
            <span>Local Database Backup & Restore</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Create instantaneous offline JSON snapshots of all users, menu items, orders, tables, and system settings.
          </p>
        </div>

        <Button
          variant="primary"
          icon={DatabaseBackup}
          loading={creating}
          onClick={handleCreateBackup}
          className="shadow-sm"
        >
          Create Local Backup Now
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Info Warning Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Offline Resilience Information</p>
          <p className="text-amber-800 mt-0.5">
            Backups are stored safely on the local file system in the server's backup directory. You can download
            the backup JSON files for off-site archiving or restore any snapshot with 1-click.
          </p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#1F2937]">Available Local Database Backups</h3>
          <span className="text-xs text-gray-500 font-mono">{backups.length} snapshots recorded</span>
        </div>

        {loading ? (
          <div className="p-8">
            <Loading text="Scanning local backup repository..." />
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No database backups created yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Create Local Backup Now" above to create your first snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Backup Snapshot File</th>
                  <th className="py-3 px-4">Timestamp Created</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#1F2937] flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-[#800020] shrink-0" />
                      <span>{b.filename}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">
                      {b.sizeFormatted}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={backupService.getDownloadUrl(b.filename)}
                          download={b.filename}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>

                        <button
                          onClick={() => setRestoreFilename(b.filename)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Restore
                        </button>

                        <button
                          onClick={() => setDeleteFilename(b.filename)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!restoreFilename}
        onClose={() => setRestoreFilename(null)}
        onConfirm={handleConfirmRestore}
        title="Confirm Database Restoration"
        message={`Are you sure you want to restore the database from "${restoreFilename}"? Current database contents will be overwritten with the snapshot data.`}
        confirmText="Confirm Restore Database"
        confirmVariant="danger"
        loading={restoring}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteFilename}
        onClose={() => setDeleteFilename(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Backup File"
        message={`Are you sure you want to permanently delete backup snapshot "${deleteFilename}" from local disk?`}
        confirmText="Delete Backup"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default BackupRestore;
