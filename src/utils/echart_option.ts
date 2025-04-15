export const getExpendLineOption = (data) => {
  return {
    legend: {
    },
    tooltip: {},
    xAxis: { type: 'category', gridIndex: 0, data: data.months.map((item) => `${item}月`)},
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '支出',
        type: 'bar',
        barGap: 0,
        label: {
          show: true
        },
        itemStyle: {
          normal: {
            color: '#008000'
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: data.expends
      },
      {
        name: '收入',
        type: 'bar',
        barGap: 0,
        label: {
          show: true
        },
        itemStyle: {
          normal: {
            color: '#FF0000'
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: data.incomes
      }
    ]
  };
}

export const getPieOption = (data) => {
  return {
    title: {
      text: '消费分类占比',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
}