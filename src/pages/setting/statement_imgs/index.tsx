import { Component, useEffect, useState } from 'react'
import { View, Image } from '@tarojs/components'
import jz from '@/jz'
import BasePage from '@/components/BasePage'
import Taro from "@tarojs/taro"

const StatementImgs: React.FC = () => {
	const [dataTimeline, setDateTimeline] = useState([])
	const itemWidth = jz.systemInfo.screenWidth / 4 - 2
	const fetchImages = async () => {
		const {data} = await jz.api.statements.getStatementImages()
		setDateTimeline(data.data.avatar_timeline)

	}
	const showPicturePreview = (e) => {
		Taro.previewImage({
			enablesavephoto: true,
			current: e,
			urls: [e.path]
		})
	}

	useEffect(() => {
		fetchImages()
	}, [])

  return (
    <BasePage
      headerName='账单搜索'
    >
      <View>
				<View className='statement-images'>
					{dataTimeline.map((item, index) => (
						<View key={index}>
							<View>
								<View className='year'>{item.year}年</View>
							</View>
							{item.data.map((data, dataIndex) => (
								<View className='each-month-images' key={dataIndex}>
									<View className='month'>{data.month}月</View>
									<View className='image-item-list'>
										{data.data && data.data.map((e, eIndex) => (
											<View className='image-item' key={eIndex}>
												<Image
													style={`width: ${itemWidth}PX;height:${itemWidth}PX`}
													onClick={() => showPicturePreview(e)}
													lazy-load="true"
													src={e.path}
												></Image>
												<View className="statement-info" onClick={() => { jz.router.navigateTo({ url: `/pages/statement_detail/index?statement_id=${e.statement_id}` }) }}>
													查看账单详情
												</View>
											</View>
										))}
									</View>
								</View>
							))}
						</View>
					))}
				</View>
      </View>
    </BasePage>
  )
}

export default StatementImgs