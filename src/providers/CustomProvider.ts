import { TreeItem } from 'vscode';
import { BaseProvider, TreeNode } from './BaseProvider';
import Global from '../global';
import { NGA } from '../nga';

export default class CustomProvider extends BaseProvider {
  private rootElements: TreeNode[] = [];
  private _tipNode = new TreeNode('还没有添加自定义节点', false);

  constructor() {
    super();

    this.refreshNodeList();
  }

  /**
   * 刷新节点列表
   */
  refreshNodeList() {
    const customNodes = Global.getCustomNodes();
    if (customNodes.length) {
      this.rootElements = customNodes.map<TreeNode>((n) => {
        const treeNode = new TreeNode(n.title.replace(' NGA玩家社区', ''), true);
        treeNode.nodeName = n.name;
        return treeNode;
      });
    } else {
      this.rootElements = [this._tipNode];
    }
    this._onDidChangeTreeData.fire(undefined);
  }

  private async getElementData(root: TreeNode): Promise<TreeNode[]> {
    try {
      const topics = await NGA.getTopicListByNode({
        name: root.nodeName!,
        title: root.label as string
      });
      const children: TreeNode[] = [];
      topics.forEach((topic) => {
        const child = new TreeNode(topic.title, false);
        child.link = topic.link;
        // 添加点击事件的命令
        child.command = {
          title: topic.title,
          command: 'nga.topicItemClick',
          tooltip: topic.title,
          arguments: [child]
        };
        children.push(child);
      });
      console.log(`获取到【${root.label}】数据：${topics.length}条`);
      return children;
    } catch (err) {
      throw err;
    }
  }

  /**
   * 刷新指定节点
   */
  async refreshRoot(root: TreeNode) {
    delete root.children;
    this._onDidChangeTreeData.fire(root);
  }

  /**
   * 刷新全部数据
   */
  refreshAll() {
    this.rootElements.forEach((root) => {
      // 只刷新已经加载过的节点数据
      if (root.children) {
        this.refreshRoot(root);
      }
    });
  }

  getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (element === undefined) {
      return this.rootElements;
    }
    if (element.children) {
      return element.children;
    } else {
      const children = await this.getElementData(element);
      element.children = children;
      return children;
    }
  }
}
