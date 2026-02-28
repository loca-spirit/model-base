import { Column, deserialize, ModelBase, serialize } from '@model-base/core'

class ConsumerItem extends ModelBase {
  @Column({ emptyValue: '' })
  message?: string
  @Column()
  testMy?: string
  @Column({ model: () => ConsumerItem })
  list?: ConsumerItem[]
  @Column({ model: () => ConsumerItem, type: 'record' })
  objRecord?: { [key: string]: ConsumerItem }
  @Column({ model: () => ConsumerItem, type: 'recordArray' })
  objRecordArr?: { [key: string]: ConsumerItem[] }
}

describe('emptyValue', () => {
  it('message is null and list is empty', () => {
    const expected = {
      message: '',
    }
    const c = deserialize(ConsumerItem, {
      message: null,
      list: [],
    })

    expect(serialize(c, { enableEmptyValue: true })).toEqual(expected)
  })

  it('objRecord is null and objRecordArr is empty', () => {
    const expected = {
      message: '',
      obj_record: { a: { message: '' } },
      obj_record_arr: {},
    }
    const c = deserialize(ConsumerItem, {
      objRecord: { a: { message: null } },
      objRecordArr: { a: [] },
    })

    expect(serialize(c, { enableEmptyValue: true })).toEqual(expected)
  })

  it('list is null', () => {
    const expected = {
      message: '',
      list: [{ message: '' }],
    }
    const c = deserialize(ConsumerItem, {
      list: [{ message: null }],
    })

    expect(serialize(c, { enableEmptyValue: true })).toEqual(expected)
  })

  it('getChangedData message is no change', () => {
    const expected = {}
    const c = deserialize(ConsumerItem, {})

    expect(c.getChangedData({ enableEmptyValue: true })).toEqual(expected)
  })

  it('getChangedData testMy is change', () => {
    const expected = {
      test_my: 'test1',
    }
    const c = deserialize(ConsumerItem, { message: 'test', testMy: 'test' })
    c.testMy = 'test1'

    expect(c.getChangedData({ enableEmptyValue: true })).toEqual(expected)
  })
  it('getChangedData message is null ', () => {
    const expected = {
      message: '',
    }
    const c = deserialize(ConsumerItem, { message: 'test' })
    c.message = null as any

    expect(c.getChangedData({ enableEmptyValue: true })).toEqual(expected)
  })

  it('getSerializableObject message is null and list is empty', () => {
    const expected = {
      message: '',
    }
    const c = deserialize(ConsumerItem, {})

    expect(c.getSerializableObject({ enableEmptyValue: true })).toEqual(expected)
  })
})
