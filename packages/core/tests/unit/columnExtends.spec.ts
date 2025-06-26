import { Column, ModelBase } from '@model-base/core'

export class ColumnTestParent extends ModelBase {
  @Column()
  public userName!: string
}

export class ColumnTest extends ColumnTestParent {
  @Column()
  public userNameSub!: string
}

describe('modelbase extends', () => {
  it('getColumns', () => {
    const columnTest = new ColumnTest()
    const columnTestParent = new ColumnTestParent()
    const columns = columnTest.getColumns()
    const columnsParent = columnTestParent.getColumns()
    const obj = {
      userNameSub: {
        name: 'user_name_sub',
        camelCaseName: 'userNameSub',
      },
      userName: {
        name: 'user_name',
        camelCaseName: 'userName',
      },
    }
    const objParent = {
      userName: {
        name: 'user_name',
        camelCaseName: 'userName',
      },
    }
    expect(columns).toEqual(obj)
    console.log(columnsParent)
    expect(columnsParent).toEqual(objParent)
  })
})
