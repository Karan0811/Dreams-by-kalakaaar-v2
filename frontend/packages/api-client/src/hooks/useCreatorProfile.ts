"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCreatorAddressPayload,
  CreateCreatorBankDetailPayload,
  CreateCreatorDocumentPayload,
  CreateCreatorSocialLinkPayload,
  CreatorAddress,
  CreatorBankDetail,
  CreatorDocument,
  CreatorSocialLink,
  MediaUploadUrlResponse,
  RequestCreatorDocumentUploadPayload,
  UpdateCreatorAddressPayload,
  UpdateCreatorBankDetailPayload,
  UpdateCreatorSocialLinkPayload,
} from "@dbk/types";
import { browserFetch } from "../browserFetch";
import {
  creatorAddressKeys,
  creatorBankDetailKeys,
  creatorDocumentKeys,
  creatorSocialLinkKeys,
} from "../query-keys";

// --- Addresses -------------------------------------------------------------

export function useCreatorAddresses() {
  return useQuery({
    queryKey: creatorAddressKeys.list(),
    queryFn: () =>
      browserFetch<{ data: CreatorAddress[] }>("/api/creator/addresses").then((r) => r.data),
  });
}

export function useCreateCreatorAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreatorAddressPayload) =>
      browserFetch<CreatorAddress>("/api/creator/addresses", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorAddressKeys.list() }),
  });
}

export function useUpdateCreatorAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, ...input }: UpdateCreatorAddressPayload & { addressId: string }) =>
      browserFetch<CreatorAddress>(`/api/creator/addresses/${addressId}`, { method: "PATCH", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorAddressKeys.list() }),
  });
}

export function useDeleteCreatorAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) =>
      browserFetch<void>(`/api/creator/addresses/${addressId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorAddressKeys.list() }),
  });
}

// --- Bank details ------------------------------------------------------------

export function useCreatorBankDetails() {
  return useQuery({
    queryKey: creatorBankDetailKeys.list(),
    queryFn: () =>
      browserFetch<{ data: CreatorBankDetail[] }>("/api/creator/bank-details").then((r) => r.data),
  });
}

export function useCreateCreatorBankDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreatorBankDetailPayload) =>
      browserFetch<CreatorBankDetail>("/api/creator/bank-details", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorBankDetailKeys.list() }),
  });
}

export function useUpdateCreatorBankDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bankDetailId, ...input }: UpdateCreatorBankDetailPayload & { bankDetailId: string }) =>
      browserFetch<CreatorBankDetail>(`/api/creator/bank-details/${bankDetailId}`, {
        method: "PATCH",
        body: input,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorBankDetailKeys.list() }),
  });
}

export function useDeleteCreatorBankDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bankDetailId: string) =>
      browserFetch<void>(`/api/creator/bank-details/${bankDetailId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorBankDetailKeys.list() }),
  });
}

// --- Social links --------------------------------------------------------

export function useCreatorSocialLinks() {
  return useQuery({
    queryKey: creatorSocialLinkKeys.list(),
    queryFn: () =>
      browserFetch<{ data: CreatorSocialLink[] }>("/api/creator/social-links").then((r) => r.data),
  });
}

export function useCreateCreatorSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreatorSocialLinkPayload) =>
      browserFetch<CreatorSocialLink>("/api/creator/social-links", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorSocialLinkKeys.list() }),
  });
}

export function useUpdateCreatorSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ socialLinkId, ...input }: UpdateCreatorSocialLinkPayload & { socialLinkId: string }) =>
      browserFetch<CreatorSocialLink>(`/api/creator/social-links/${socialLinkId}`, {
        method: "PATCH",
        body: input,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorSocialLinkKeys.list() }),
  });
}

export function useDeleteCreatorSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (socialLinkId: string) =>
      browserFetch<void>(`/api/creator/social-links/${socialLinkId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorSocialLinkKeys.list() }),
  });
}

// --- Documents -------------------------------------------------------------

export function useCreatorDocuments() {
  return useQuery({
    queryKey: creatorDocumentKeys.list(),
    queryFn: () =>
      browserFetch<{ data: CreatorDocument[] }>("/api/creator/documents").then((r) => r.data),
  });
}

export function useRequestCreatorDocumentUpload() {
  return useMutation({
    mutationFn: (input: RequestCreatorDocumentUploadPayload) =>
      browserFetch<MediaUploadUrlResponse>("/api/creator/documents/upload-url", {
        method: "POST",
        body: input,
      }),
  });
}

export function useCreateCreatorDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreatorDocumentPayload) =>
      browserFetch<CreatorDocument>("/api/creator/documents", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorDocumentKeys.list() }),
  });
}

export function useDeleteCreatorDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      browserFetch<void>(`/api/creator/documents/${documentId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: creatorDocumentKeys.list() }),
  });
}
