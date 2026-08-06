import { useState } from 'react'

interface PresetItem {
  name: string
  savedAt: string
}

interface Props {
  title: string
  presets: PresetItem[]
  onDelete: (savedAts: string[]) => void
  onClose: () => void
}

/** 프리셋을 체크박스로 여러 개 골라 한 번에 지우는 모달입니다. */
export default function PresetDeleteModal({ title, presets, onDelete, onClose }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (savedAt: string) => {
    setChecked((cur) => {
      const next = new Set(cur)
      if (next.has(savedAt)) next.delete(savedAt)
      else next.add(savedAt)
      return next
    })
  }

  const handleDelete = () => {
    if (checked.size === 0) return
    if (!confirm(`선택한 프리셋 ${checked.size}개를 삭제할까요?`)) return
    onDelete([...checked])
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="modal-list">
          {presets.length === 0 && <p className="hint">저장된 프리셋이 없습니다.</p>}
          {[...presets].reverse().map((p) => (
            <label key={p.savedAt} className="modal-item">
              <input
                type="checkbox"
                checked={checked.has(p.savedAt)}
                onChange={() => toggle(p.savedAt)}
              />
              <span className="modal-item-name">{p.name}</span>
              <span className="modal-item-date">
                {new Date(p.savedAt).toLocaleString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>닫기</button>
          <button className="danger" disabled={checked.size === 0} onClick={handleDelete}>
            선택 삭제 ({checked.size})
          </button>
        </div>
      </div>
    </div>
  )
}
