import React from 'react'
import { Button as B } from '@tarojs/components'

export const Button = ({
  title,
  className = '',
  ...props
}) => {
  return (
    <B 
      className={`jz-common-components__button ${props.danger ? 'dangerous' : ''} ${className}`} 
      {...props}
    >
      { title }
    </B>
  )
}