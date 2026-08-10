import "server-only";
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
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

// --- Addresses -------------------------------------------------------------

export async function fetchCreatorAddresses(accessToken: string): Promise<{ data: CreatorAddress[] }> {
  return apiFetch<{ data: CreatorAddress[] }>("/creator/addresses", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createCreatorAddress(
  accessToken: string,
  input: CreateCreatorAddressPayload,
): Promise<CreatorAddress> {
  return apiFetch<CreatorAddress>("/creator/addresses", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateCreatorAddress(
  accessToken: string,
  addressId: string,
  input: UpdateCreatorAddressPayload,
): Promise<CreatorAddress> {
  return apiFetch<CreatorAddress>(`/creator/addresses/${addressId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteCreatorAddress(accessToken: string, addressId: string): Promise<void> {
  await apiFetch<void>(`/creator/addresses/${addressId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

// --- Bank details ------------------------------------------------------------

export async function fetchCreatorBankDetails(accessToken: string): Promise<{ data: CreatorBankDetail[] }> {
  return apiFetch<{ data: CreatorBankDetail[] }>("/creator/bank-details", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createCreatorBankDetail(
  accessToken: string,
  input: CreateCreatorBankDetailPayload,
): Promise<CreatorBankDetail> {
  return apiFetch<CreatorBankDetail>("/creator/bank-details", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateCreatorBankDetail(
  accessToken: string,
  bankDetailId: string,
  input: UpdateCreatorBankDetailPayload,
): Promise<CreatorBankDetail> {
  return apiFetch<CreatorBankDetail>(`/creator/bank-details/${bankDetailId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteCreatorBankDetail(accessToken: string, bankDetailId: string): Promise<void> {
  await apiFetch<void>(`/creator/bank-details/${bankDetailId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

// --- Social links --------------------------------------------------------

export async function fetchCreatorSocialLinks(accessToken: string): Promise<{ data: CreatorSocialLink[] }> {
  return apiFetch<{ data: CreatorSocialLink[] }>("/creator/social-links", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createCreatorSocialLink(
  accessToken: string,
  input: CreateCreatorSocialLinkPayload,
): Promise<CreatorSocialLink> {
  return apiFetch<CreatorSocialLink>("/creator/social-links", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateCreatorSocialLink(
  accessToken: string,
  socialLinkId: string,
  input: UpdateCreatorSocialLinkPayload,
): Promise<CreatorSocialLink> {
  return apiFetch<CreatorSocialLink>(`/creator/social-links/${socialLinkId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteCreatorSocialLink(accessToken: string, socialLinkId: string): Promise<void> {
  await apiFetch<void>(`/creator/social-links/${socialLinkId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

// --- Documents -------------------------------------------------------------

export async function fetchCreatorDocuments(accessToken: string): Promise<{ data: CreatorDocument[] }> {
  return apiFetch<{ data: CreatorDocument[] }>("/creator/documents", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function requestCreatorDocumentUpload(
  accessToken: string,
  input: RequestCreatorDocumentUploadPayload,
): Promise<MediaUploadUrlResponse> {
  return apiFetch<MediaUploadUrlResponse>("/creator/documents/upload-url", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function createCreatorDocument(
  accessToken: string,
  input: CreateCreatorDocumentPayload,
): Promise<CreatorDocument> {
  return apiFetch<CreatorDocument>("/creator/documents", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function deleteCreatorDocument(accessToken: string, documentId: string): Promise<void> {
  await apiFetch<void>(`/creator/documents/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
