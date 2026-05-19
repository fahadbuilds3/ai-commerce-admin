import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productApi from "../api/productApi";

const PRODUCTS_KEY = ["products"];

/**
 * Normalizes backend response: always returns a plain array of products.
 * Supports:
 *   - { data: { products: [...] } }
 *   - { data: { data: [...] } }
 *   - { data: [...] }
 *   - { products: [...] }
 *   - [] (bare array)
 */
function extractProducts(raw) {
  if (!raw) return [];
  // Bare array: []
  if (Array.isArray(raw)) return raw;
  // { data: { products: [...] } }
  if (raw.data && Array.isArray(raw.data.products)) return raw.data.products;
  // { data: { data: [...] } }
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  // { data: [...] }
  if (Array.isArray(raw.data)) return raw.data;
  // { products: [...] }
  if (Array.isArray(raw.products)) return raw.products;
  return []; // Fallback: always array
}

/**
 * useProducts
 * Fetches and returns just a products array. Always returns [] fallback.
 * Usage: const { data: products, ...query } = useProducts();
 */
export function useProducts(params = {}) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, params],
    queryFn: async () => {
      const raw = await productApi.fetchProducts(params);
      return extractProducts(raw);
    },
    select: (products) => (Array.isArray(products) ? products : []),
    keepPreviousData: true,
    staleTime: 30 * 1000 // 30s
  });
}

/**
 * useCreateProduct
 * Adds product optimistically and keeps cache in sync.
 */
export function useCreateProduct(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => productApi.createProduct(data),
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = queryClient.getQueryData(PRODUCTS_KEY);
      queryClient.setQueryData(PRODUCTS_KEY, (old = []) => [
        { ...newProduct, id: "temp-id-" + Date.now() },
        ...old,
      ]);
      return { prev };
    },
    onError: (_err, _newProduct, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(PRODUCTS_KEY, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
    ...options,
  });
}

/**
 * useUpdateProduct
 * Updates product in cache by id optimistically.
 */
export function useUpdateProduct(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productApi.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = queryClient.getQueryData(PRODUCTS_KEY);
      queryClient.setQueryData(PRODUCTS_KEY, (old = []) =>
        old.map((prod) => (prod.id === id ? { ...prod, ...data } : prod))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(PRODUCTS_KEY, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
    ...options,
  });
}

/**
 * useDeleteProduct
 * Removes product from cache by id optimistically.
 */
export function useDeleteProduct(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productApi.deleteProduct(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = queryClient.getQueryData(PRODUCTS_KEY);
      queryClient.setQueryData(PRODUCTS_KEY, (old = []) =>
        old.filter((prod) => prod.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(PRODUCTS_KEY, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
    ...options,
  });
}