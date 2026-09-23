import type { StatementListItem } from '@/api/types'
import { View } from '@tarojs/components'
import Statement from '../Statement'

export default function Statements({
  statements = [],
  editable = true
}: {
  statements?: StatementListItem[]
  editable?: boolean
}) {
  return (
    <View className="p-2">
      {statements.map((statement) => (
        <Statement key={statement.id} statement={statement} editable={editable}></Statement>
      ))}
    </View>
  )
}
