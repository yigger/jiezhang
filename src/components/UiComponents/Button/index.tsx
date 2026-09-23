import type { ButtonProps, ITouchEvent } from '@tarojs/components'
import { Button as B } from '@tarojs/components'
import { useRef, useState } from 'react'
import { guardEvent } from '../../../utils/async'

type Props = Omit<ButtonProps, 'onClick'> & {
  title: string
  danger?: boolean
  onClick?: (event: ITouchEvent) => unknown
}

export const Button = ({ title, className = '', danger = false, onClick, ...props }: Props) => {
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const handleClick = guardEvent(async (event: ITouchEvent) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      await onClick?.(event)
    } finally {
      pending.current = false
      setBusy(false)
    }
  })
  return (
    <B
      {...props}
      onClick={handleClick}
      disabled={props.disabled || busy}
      loading={props.loading || busy}
      className={`jz-common-components__button ${danger ? 'dangerous' : ''} ${className}`}
    >
      {title}
    </B>
  )
}
