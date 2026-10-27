'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Tag as TagIcon,
  Check,
  Pencil,
  Trash2,
  Plus,
  Clock,
  SlidersHorizontal,
  RotateCcw,
  Activity,
} from 'lucide-react';
import type {
  UserProfileSummary,
  Tag,
  TagColorToken,
} from '../../types/database';
import { HeaderBar } from '../../components/HeaderBar';
import { MobileBottomDock } from '../../components/MobileBottomDock';
import { UserAvatar } from '../../components/UserAvatar';
import { BadgeClassification } from '../../components/BadgeClassification';
import { TagBadge, TAG_COLOR_STYLES } from '../../components/TagBadge';
import { VALID_TAG_COLORS } from '../../lib/user-display';

type SettingsTab = 'users' | 'tags';

function formatRelativeActivity(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Hace instantes';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `Hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [profiles, setProfiles] = useState<UserProfileSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Estados de edición de Alias por user_id
  const [aliasDrafts, setAliasDrafts] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Estados de ABM de Etiquetas
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagNameInput, setTagNameInput] = useState<string>('');
  const [tagColorInput, setTagColorInput] = useState<TagColorToken>('indigo');
  const [savingTag, setSavingTag] = useState<boolean>(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState<string | null>(
    null
  );
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const fetchSettingsData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, tagsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/tags'),
      ]);

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        const userList: UserProfileSummary[] = usersJson.users || [];
        setProfiles(userList);
        const drafts: Record<string, string> = {};
        for (const u of userList) {
          drafts[u.id] = u.alias || '';
        }
        setAliasDrafts(drafts);
      }

      if (tagsRes.ok) {
        const tagsJson = await tagsRes.json();
        setTags(tagsJson.tags || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error cargando datos de Configuración:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initSettings() {
      try {
        const [usersRes, tagsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/tags'),
        ]);

        if (ignore) return;

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('tab') === 'tags') {
            setActiveTab('tags');
          }
        }

        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          const userList: UserProfileSummary[] = usersJson.users || [];
          setProfiles(userList);
          const drafts: Record<string, string> = {};
          for (const u of userList) {
            drafts[u.id] = u.alias || '';
          }
          setAliasDrafts(drafts);
        }

        if (tagsRes.ok) {
          const tagsJson = await tagsRes.json();
          setTags(tagsJson.tags || []);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error inicializando Configuración:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    initSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveAlias = async (userId: string, aliasValue: string | null) => {
    setSavingUserId(userId);
    setUserError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: aliasValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar el alias');
      }

      const updatedAlias: string | null = data.user.alias ?? null;
      const updatedDisplay: string = data.user.display_name;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId
            ? { ...p, alias: updatedAlias, display_name: updatedDisplay }
            : p
        )
      );
      setAliasDrafts((prev) => ({
        ...prev,
        [userId]: updatedAlias || '',
      }));
      setSavedUserId(userId);
      setTimeout(() => {
        setSavedUserId((curr) => (curr === userId ? null : curr));
      }, 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al guardar el alias';
      setUserError(msg);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleTagFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNameInput.trim() || savingTag) return;

    setSavingTag(true);
    setTagError(null);

    try {
      if (editingTagId) {
        const res = await fetch(`/api/tags/${editingTagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tagNameInput.trim(),
            color: tagColorInput,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al actualizar la etiqueta');
        }
        const updatedTag: Tag = data.tag;
        setTags((prev) =>
          prev
            .map((t) => (t.id === updatedTag.id ? updatedTag : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingTagId(null);
        setTagNameInput('');
        setTagColorInput('indigo');
      } else {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tagNameInput.trim(),
            color: tagColorInput,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al crear la etiqueta');
        }
        const createdTag: Tag = data.tag;
        setTags((prev) =>
          [...prev, createdTag].sort((a, b) => a.name.localeCompare(b.name))
        );
        setTagNameInput('');
        setTagColorInput('indigo');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al procesar la etiqueta';
      setTagError(msg);
    } finally {
      setSavingTag(false);
    }
  };

  const handleStartEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setTagNameInput(tag.name);
    setTagColorInput(tag.color);
    setTagError(null);
  };

  const handleCancelEditTag = () => {
    setEditingTagId(null);
    setTagNameInput('');
    setTagColorInput('indigo');
    setTagError(null);
  };

  const handleDeleteTag = async (tagId: string) => {
    setDeletingTagId(tagId);
    setTagError(null);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar la etiqueta');
      }
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setConfirmDeleteTagId(null);
      if (editingTagId === tagId) {
        handleCancelEditTag();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al eliminar la etiqueta';
      setTagError(msg);
    } finally {
      setDeletingTagId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] relative selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900 pb-28 sm:pb-20 transition-colors">
      {/* Global Header */}
      <HeaderBar
        onRefresh={fetchSettingsData}
        isLoading={loading}
        lastUpdated={lastUpdated}
      />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Encabezado y Selector de Pestañas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
              title="Volver al Inicio"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Inicio</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="w-4 h-4 text-[var(--text-secondary)]"
                  strokeWidth={1.75}
                />
                <h1 className="text-base sm:text-lg font-semibold font-mono tracking-tight text-[var(--text-primary)]">
                  Configuración de Plataforma
                </h1>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Administración de usuarios vinculados, alias web y catálogo de
                etiquetas
              </p>
            </div>
          </div>

          {/* Segmented Control: Usuarios vs Etiquetas */}
          <div className="inline-flex items-center p-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-hairline)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Usuarios y Perfiles ({profiles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'tags'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-hairline)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Etiquetas ({tags.length})</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            PESTAÑA 1: USUARIOS VINCULADOS, ÚLTIMA ACTIVIDAD Y ALIAS
           ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {userError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400">
                {userError}
              </div>
            )}

            {loading && profiles.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] font-mono">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] animate-spin" />
                <p className="text-xs">Cargando usuarios vinculados...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="hairline-card rounded-2xl p-8 text-center text-xs font-mono text-[var(--text-muted)]">
                No hay usuarios vinculados en la plataforma aún. Envía /start al
                bot de Telegram para vincular tu cuenta.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {profiles.map((user) => {
                  const hasActivity = user.last_activity !== null;
                  const draftVal = aliasDrafts[user.id] ?? '';
                  const isSaving = savingUserId === user.id;
                  const isSaved = savedUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-colors"
                    >
                      <div className="space-y-4">
                        {/* Cabecera de Ficha de Usuario */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.display_name} size="lg" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                  {user.display_name}
                                </h2>
                                {user.alias && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                                    Alias activo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                                Telegram: {user.name} · ID #{user.telegram_id}
                              </p>
                            </div>
                          </div>

                          {/* Estado Operativo */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border shrink-0 ${
                              hasActivity
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                                : 'bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-muted)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                hasActivity
                                  ? 'bg-emerald-500'
                                  : 'bg-[var(--text-muted)]'
                              }`}
                            />
                            {hasActivity ? 'Vinculado · Activo' : 'Sin gastos'}
                          </span>
                        </div>

                        {/* Métricas de Participación */}
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                              Movimientos Cargados
                            </span>
                            <span className="text-sm sm:text-base font-mono font-semibold text-[var(--text-primary)] tabular-nums mt-0.5 block">
                              {user.transactions_count} registros
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                              Vinculado desde
                            </span>
                            <span className="text-xs sm:text-sm font-mono font-medium text-[var(--text-primary)] tabular-nums mt-0.5 block">
                              {new Date(user.created_at).toLocaleDateString(
                                'es-AR',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Bloque de Última Actividad (Último Gasto Registrado) */}
                        <div className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                              <Activity className="w-3 h-3" /> Última Actividad
                              Registrada
                            </span>
                            {user.last_activity && (
                              <span className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatRelativeActivity(
                                  user.last_activity.created_at
                                )}
                              </span>
                            )}
                          </div>

                          {user.last_activity ? (
                            <div className="pt-1 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                                  {user.last_activity.concept ||
                                    'Gasto sin descripción'}
                                </div>
                                <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                                  {new Date(
                                    user.last_activity.created_at
                                  ).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <BadgeClassification
                                  classification={
                                    user.last_activity.classification
                                  }
                                />
                                <span className="text-xs sm:text-sm font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                                  ${' '}
                                  {Number(
                                    user.last_activity.amount
                                  ).toLocaleString('es-AR', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-muted)] italic">
                              Este usuario aún no ha registrado gastos en Agyke.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Configuración de Alias / Apodo */}
                      <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={`alias-${user.id}`}
                            className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]"
                          >
                            Alias / Apodo en la Web
                          </label>
                          {user.alias && (
                            <button
                              type="button"
                              onClick={() => handleSaveAlias(user.id, null)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                              title="Volver a mostrar el nombre original de Telegram"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restaurar original</span>
                            </button>
                          )}
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveAlias(user.id, draftVal);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            id={`alias-${user.id}`}
                            type="text"
                            maxLength={24}
                            placeholder={`Apodo para ${user.name} (ej. Lau)...`}
                            value={draftVal}
                            onChange={(e) =>
                              setAliasDrafts((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="px-3.5 py-1.5 rounded-lg bg-[var(--brand-accent)] text-[var(--canvas)] text-xs font-mono font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Guardado</span>
                              </>
                            ) : isSaving ? (
                              <span>Guardando...</span>
                            ) : (
                              <span>Guardar</span>
                            )}
                          </button>
                        </form>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Reemplaza a <strong>{user.name}</strong> en toda la
                          interfaz Web. El bot de Telegram conservará el nombre
                          original.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            PESTAÑA 2: GESTOR ABM DE ETIQUETAS (TAGS CRUD)
           ========================================================= */}
        {activeTab === 'tags' && (
          <div className="space-y-6">
            {/* Panel de Creación / Edición de Etiqueta */}
            <div className="hairline-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <TagIcon
                      className="w-4 h-4 text-[var(--text-secondary)]"
                      strokeWidth={1.75}
                    />
                    {editingTagId
                      ? 'Editar Etiqueta Existente'
                      : 'Nueva Etiqueta de Clasificación'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Crea etiquetas personalizadas para agrupar gastos y preparar
                    métricas detalladas
                  </p>
                </div>

                {editingTagId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTag}
                    className="px-2.5 py-1 rounded-md border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              {tagError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400">
                  {tagError}
                </div>
              )}

              <form
                onSubmit={handleTagFormSubmit}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
              >
                {/* Nombre de Etiqueta */}
                <div className="md:col-span-5 space-y-1.5">
                  <label
                    htmlFor="tag-name-input"
                    className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block"
                  >
                    Nombre de la Etiqueta
                  </label>
                  <input
                    id="tag-name-input"
                    type="text"
                    maxLength={28}
                    placeholder="Ej. Supermercado, Salidas, Servicios..."
                    value={tagNameInput}
                    onChange={(e) => setTagNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                  />
                </div>

                {/* Selector de Color Semántico */}
                <div className="md:col-span-4 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    Color Semántico ({TAG_COLOR_STYLES[tagColorInput].label})
                  </span>
                  <div className="flex items-center gap-2 py-1">
                    {VALID_TAG_COLORS.map((colorKey) => {
                      const active = tagColorInput === colorKey;
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setTagColorInput(colorKey)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                            active
                              ? 'scale-110 border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={TAG_COLOR_STYLES[colorKey].label}
                        >
                          <span
                            className={`w-4 h-4 rounded-full ${TAG_COLOR_STYLES[colorKey].dot}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vista Previa + Botón Guardar */}
                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3">
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                      Vista Previa
                    </span>
                    <TagBadge
                      name={tagNameInput.trim() || 'etiqueta'}
                      color={tagColorInput}
                      size="sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingTag || !tagNameInput.trim()}
                    className="px-4 py-2 rounded-lg bg-[var(--brand-accent)] text-[var(--canvas)] text-xs font-mono font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    {editingTagId ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Catálogo de Etiquetas Registradas */}
            <div className="hairline-card rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[var(--border-hairline)] flex items-center justify-between bg-[var(--surface)]">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                    Catálogo de Etiquetas ({tags.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Al renombrar o cambiar el color de una etiqueta, todos los
                    gastos asociados se actualizan automáticamente
                  </p>
                </div>
              </div>

              {tags.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <TagIcon
                    className="w-6 h-6 text-[var(--text-muted)] mx-auto"
                    strokeWidth={1.5}
                  />
                  <p className="text-xs font-mono font-medium text-[var(--text-primary)]">
                    No hay etiquetas creadas todavía
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                    Usa el formulario superior para crear tu primera etiqueta
                    (por ejemplo: Supermercado, Salidas, Servicios, Mascotas).
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-hairline)]">
                  {tags.map((tag) => {
                    const isConfirmingDelete = confirmDeleteTagId === tag.id;
                    const isDeleting = deletingTagId === tag.id;

                    return (
                      <div
                        key={tag.id}
                        className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-subtle)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <TagBadge
                            name={tag.name}
                            color={tag.color}
                            size="sm"
                          />
                          <span className="text-xs font-mono text-[var(--text-secondary)]">
                            {tag.usage_count || 0} gasto
                            {(tag.usage_count || 0) === 1 ? '' : 's'} asociado
                            {(tag.usage_count || 0) === 1 ? '' : 's'}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            · Creada el{' '}
                            {new Date(tag.created_at).toLocaleDateString(
                              'es-AR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>

                        {/* Acciones de Edición y Borrado */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                                ¿Eliminar etiqueta?
                              </span>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteTag(tag.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-mono font-semibold hover:bg-rose-700 cursor-pointer"
                              >
                                {isDeleting ? '...' : 'Sí, borrar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTagId(null)}
                                className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditTag(tag)}
                                className="px-2.5 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTagId(tag.id)}
                                className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar etiqueta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Dock */}
      <MobileBottomDock
        onRefresh={fetchSettingsData}
        isLoading={loading}
      />
    </div>
  );
}
