function normalizeCategoryId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function sortCategoryNodes(nodes) {
  nodes.sort((a, b) => {
    const aOrder = Number(a.data?.sort_order ?? 0);
    const bOrder = Number(b.data?.sort_order ?? 0);

    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.label || "").localeCompare(String(b.label || ""));
  });

  nodes.forEach((node) => sortCategoryNodes(node.children || []));
}

function makeCategoryNode(category) {
  const id = normalizeCategoryId(category?.id ?? category?.key ?? category?.value);
  if (!id) return null;

  return {
    key: id,
    label: category.name || category.label || category.title || `Category ${id}`,
    data: category.data || category,
    children: [],
  };
}

function flattenInputCategories(categories = []) {
  return categories.flatMap((category) => {
    const children = Array.isArray(category?.children) ? category.children : [];
    return [
      category,
      ...flattenInputCategories(children).map((child) => ({
        ...child,
        parent_id:
          child.parent_id ??
          child.parent?.id ??
          child.data?.parent_id ??
          child.data?.parent?.id ??
          category.id ??
          category.key,
      })),
    ];
  });
}

export function buildCategoryTree(categories = []) {
  const nodesById = new Map();
  const idsByName = new Map();
  const roots = [];
  const flatCategories = flattenInputCategories(categories);

  flatCategories.forEach((category) => {
    const node = makeCategoryNode(category);
    if (!node) return;

    nodesById.set(node.key, node);

    const name = String(node.label || "").trim().toLowerCase();
    if (name && !idsByName.has(name)) {
      idsByName.set(name, node.key);
    }
  });

  flatCategories.forEach((category) => {
    const id = normalizeCategoryId(category?.id ?? category?.key ?? category?.value);
    const node = nodesById.get(id);
    if (!node) return;

    const parentName = String(
      category.parent_name || category.parent?.name || category.data?.parent_name || "",
    )
      .trim()
      .toLowerCase();
    const parentId = normalizeCategoryId(
      category.parent_id ??
        category.parent?.id ??
        category.data?.parent_id ??
        category.data?.parent?.id ??
        idsByName.get(parentName),
    );

    if (parentId && parentId !== id && nodesById.has(parentId)) {
      nodesById.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortCategoryNodes(roots);
  return roots;
}

export function toTreeSelectionValue(value) {
  const id = normalizeCategoryId(value);
  return id ? { [id]: { checked: true, partialChecked: false } } : null;
}

export function toTreeSelectionValues(values = []) {
  const selection = {};

  values.forEach((value) => {
    const id = normalizeCategoryId(value);
    if (id) selection[id] = { checked: true, partialChecked: false };
  });

  return Object.keys(selection).length > 0 ? selection : null;
}

export function getTreeSelectionValue(selection) {
  if (!selection) return null;
  if (typeof selection === "string" || typeof selection === "number") {
    return normalizeCategoryId(selection);
  }

  return (
    Object.keys(selection).find((key) => {
      const value = selection[key];
      return value === true || value?.checked === true;
    }) || null
  );
}

export function getTreeSelectionValues(selection) {
  if (!selection) return [];
  if (Array.isArray(selection)) {
    return selection.map(normalizeCategoryId).filter(Boolean);
  }
  if (typeof selection === "string" || typeof selection === "number") {
    const id = normalizeCategoryId(selection);
    return id ? [id] : [];
  }

  return Object.keys(selection).filter((key) => {
    const value = selection[key];
    return value === true || value?.checked === true;
  });
}

export function flattenCategoryTree(nodes = []) {
  return nodes.flatMap((node) => [
    node,
    ...flattenCategoryTree(node.children || []),
  ]);
}

export function getCategorySequence(category) {
  return category?.sequence ?? category?.pivot?.sequence ?? null;
}

export function getPrimaryProductCategory(product) {
  return product?.primary_category || product?.category || null;
}

export function getProductCategories(product) {
  const categories = Array.isArray(product?.categories)
    ? product.categories
    : [];

  if (categories.length > 0) return categories;

  const fallback = getPrimaryProductCategory(product);
  return fallback ? [fallback] : [];
}

export function buildCategorySequences(categoryIds = []) {
  return categoryIds.reduce((sequences, categoryId, index) => {
    sequences[categoryId] = index + 1;
    return sequences;
  }, {});
}
