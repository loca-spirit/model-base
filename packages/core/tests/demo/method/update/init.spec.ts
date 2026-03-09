import { Column, ModelBase } from "@model-base/core"
// region model
class TestItem extends ModelBase {
  @Column({ primary: true })
  public id?: string

  @Column()
  public title?: string

  @Column()
  public done?: boolean
}

class Test extends ModelBase {
  @Column({
    model: () => TestItem,
  })
  public list?: TestItem[]
}
// endregion model

// region instance
const test1 = new Test({
  list: [
    {
      id: "1",
      title: "old title",
      done: false,
    },
  ],
})
// endregion instance

// region update
const result = test1.update({
  list: [
    {
      id: "1",
      title: "new title",
    },
    {
      id: "2",
      title: "new item",
      done: true,
    },
  ],
})
// endregion update

describe("update", () => {
  it("should update nested models by primary key", () => {
    expect(result).toBe(test1)
    expect(test1.list).toHaveLength(2)
    expect(test1.list?.[0].title).toBe("new title")
    expect(test1.list?.[0].done).toBe(false)
    expect(test1.list?.[1].id).toBe("2")
    expect(test1.list?.[1].title).toBe("new item")
  })
})

// region log
console.log(test1.getSerializableObject())
// {
//   list: [
//     { id: "1", title: "new title", done: false },
//     { id: "2", title: "new item", done: true },
//   ],
// }
// endregion log