import React, { useState } from 'react';
import { X, Folder, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import { Category } from '../types';
import { deleteCategory, saveCategory } from '../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoriesUpdated: (cats: Category[]) => void;
}

export const CategoriesManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name: newCatName.trim(),
      icon: newCatIcon || '📁',
      isDefault: false,
      order: categories.length + 1,
    };

    await saveCategory(newCat);
    const updated = [...categories, newCat];
    onCategoriesUpdated(updated);
    setNewCatName('');
    setFeedback(`Categoria "${newCat.name}" criada com sucesso!`);
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (cat: Category) => {
    if (!editingName.trim()) return;
    const updatedCat: Category = {
      ...cat,
      name: editingName.trim(),
    };
    await saveCategory(updatedCat);
    const updatedList = categories.map((c) => (c.id === cat.id ? updatedCat : c));
    onCategoriesUpdated(updatedList);
    setEditingCatId(null);
  };

  const handleDelete = async (cat: Category) => {
    if (cat.name.toLowerCase() === 'outros') {
      alert('A categoria "Outros" é padrão do sistema e não pode ser removida.');
      return;
    }

    if (
      window.confirm(
        `Excluir a categoria "${cat.name}"?\nOs sites pertencentes a ela serão movidos automaticamente para a categoria "Outros".`
      )
    ) {
      await deleteCategory(cat.id, cat.name);
      const updatedList = categories.filter((c) => c.id !== cat.id);
      onCategoriesUpdated(updatedList);
      setFeedback(`Categoria removida. Os sites foram movidos para "Outros".`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Gerenciar Categorias</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize seus sites por grupos temáticos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Emoji"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            maxLength={4}
            className="w-14 text-center px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-none"
          />
          <input
            type="text"
            placeholder="Nova categoria..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Criar
          </button>
        </form>

        {/* Categories List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                <span className="text-lg shrink-0">{cat.icon || '📁'}</span>
                {editingCatId === cat.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {cat.name}
                  </span>
                )}
                {cat.isDefault && (
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                    Padrão
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {editingCatId === cat.id ? (
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(cat)}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    title="Salvar nome"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Editar nome"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {cat.name.toLowerCase() !== 'outros' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Ao excluir, os sites são movidos para &quot;Outros&quot;.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
