/**
 * Build a tree structure from flat messages array
 */
export function buildMessageTree(messages) {
  if (!messages || messages.length === 0) {
    return { tree: [], messageMap: new Map() };
  }

  const messageMap = new Map();
  const tree = [];

  // Create a map for quick lookup and initialize children arrays
  messages.forEach(msg => {
    messageMap.set(msg.msg_id, {
      ...msg,
      children: []
    });
  });

  // Build tree structure
  messages.forEach(msg => {
    const node = messageMap.get(msg.msg_id);
    
    if (msg.parent_msg_id === null || msg.parent_msg_id === undefined) {
      // Root node
      tree.push(node);
    } else {
      // Child node
      const parent = messageMap.get(msg.parent_msg_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan node (parent not found) - treat as root
        console.warn(`Parent ${msg.parent_msg_id} not found for message ${msg.msg_id}`);
        tree.push(node);
      }
    }
  });

  // Sort function for children by p_order
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.p_order ?? 0) - (b.p_order ?? 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(tree);

  return { tree, messageMap };
}

/**
 * Get the active path through the tree based on selected versions
 * @param {Array} tree - Root nodes of message tree
 * @param {Object} selectedVersions - Map of parent_msg_id -> selected child index
 * @returns {Array} - Linear array of messages in the active path
 */
export function getActivePath(tree, selectedVersions = {}) {
  if (!tree || tree.length === 0) {
    return [];
  }

  const path = [];

  function traverse(nodes, parentId) {
    if (!nodes || nodes.length === 0) return;

    // Get the selected index for this parent (default to 0 - first/original version)
    const parentKey = parentId ?? 'root';
    const selectedIndex = selectedVersions[parentKey] ?? 0;
    
    // Clamp index to valid range
    const clampedIndex = Math.max(0, Math.min(selectedIndex, nodes.length - 1));
    const selectedNode = nodes[clampedIndex];

    if (selectedNode) {
      path.push({
        ...selectedNode,
        siblingCount: nodes.length,
        siblingIndex: clampedIndex
      });

      // Continue traversing with selected node's children
      if (selectedNode.children && selectedNode.children.length > 0) {
        traverse(selectedNode.children, selectedNode.msg_id);
      }
    }
  }

  traverse(tree, null);
  return path;
}

/**
 * Get siblings of a message (same parent)
 */
export function getSiblings(messageMap, message) {
  if (!message || !messageMap) return [];
  
  const siblings = [];
  const targetParentId = message.parent_msg_id;
  
  messageMap.forEach((msg) => {
    if (msg.parent_msg_id === targetParentId && 
        msg.chat_id === message.chat_id) {
      siblings.push(msg);
    }
  });

  return siblings.sort((a, b) => (a.p_order ?? 0) - (b.p_order ?? 0));
}

/**
 * Find the index of a message among its siblings
 */
export function getSiblingIndex(messageMap, message) {
  const siblings = getSiblings(messageMap, message);
  return siblings.findIndex(s => s.msg_id === message.msg_id);
}

/**
 * Get the path from root to a specific message
 */
export function getPathToMessage(messageMap, msgId) {
  if (!messageMap || !msgId) return [];
  
  const path = [];
  let current = messageMap.get(msgId);

  while (current) {
    path.unshift(current);
    current = current.parent_msg_id 
      ? messageMap.get(current.parent_msg_id) 
      : null;
  }

  return path;
}

/**
 * Calculate which versions should be selected to show a specific message
 */
export function getVersionSelections(messageMap, msgId) {
  if (!messageMap || !msgId) return {};
  
  const selections = {};
  const path = getPathToMessage(messageMap, msgId);

  path.forEach((msg) => {
    const parentKey = msg.parent_msg_id ?? 'root';
    const siblings = getSiblings(messageMap, msg);
    const index = siblings.findIndex(s => s.msg_id === msg.msg_id);
    if (index >= 0) {
      selections[parentKey] = index;
    }
  });

  return selections;
}

/**
 * Find all leaf messages (messages with no children)
 */
export function findLeafMessages(messageMap) {
  if (!messageMap) return [];
  
  const leaves = [];
  
  messageMap.forEach((msg) => {
    if (!msg.children || msg.children.length === 0) {
      leaves.push(msg);
    }
  });

  return leaves;
}

/**
 * Get depth of a message in the tree
 */
export function getMessageDepth(messageMap, msgId) {
  const path = getPathToMessage(messageMap, msgId);
  return path.length;
}