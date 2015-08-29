export default function({ Plugin, types: t }) {

  return new Plugin('flow-babel', {
    visitor: {
      ClassProperty(node, parent) {
        this.dangerouslyRemove()
      }
    }
  })

}
