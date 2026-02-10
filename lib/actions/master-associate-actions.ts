"use server";

import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export interface Associate {
  kode: string;
  nama: string;
  kategori: 'Direct' | 'Associate';
  status: 'Aktif' | 'Non-Aktif';
}

// Read all associates
export async function getAssociates(): Promise<Associate[]> {
  try {
    const associates = await fetchQuery(api.masterAssociate.getAssociates, {});
    return associates.map(assoc => ({
      kode: assoc.kode,
      nama: assoc.nama,
      kategori: assoc.kategori,
      status: assoc.status,
    }));
  } catch (error) {
    console.error('Error reading associate data:', error);
    return [];
  }
}

// Add new associate
export async function addAssociate(associate: Omit<Associate, 'kode'>): Promise<{ success: boolean; message: string; data?: Associate }> {
  try {
    const result = await fetchMutation(api.masterAssociate.addAssociate, {
      nama: associate.nama,
      kategori: associate.kategori,
      status: associate.status,
    });

    return {
      success: result.success,
      message: result.message,
      data: result.data ? {
        kode: result.data.kode,
        nama: result.data.nama,
        kategori: result.data.kategori,
        status: result.data.status,
      } : undefined,
    };
  } catch (error: any) {
    console.error('Error adding associate:', error);
    return { success: false, message: error.message || 'Gagal menambahkan associate' };
  }
}

// Update associate
export async function updateAssociate(kode: string, associate: Omit<Associate, 'kode'>): Promise<{ success: boolean; message: string }> {
  try {
    const result = await fetchMutation(api.masterAssociate.updateAssociate, {
      kode: kode,
      nama: associate.nama,
      kategori: associate.kategori,
      status: associate.status,
    });

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error: any) {
    console.error('Error updating associate:', error);
    return { success: false, message: error.message || 'Gagal mengupdate associate' };
  }
}

// Delete associate
export async function deleteAssociate(kode: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await fetchMutation(api.masterAssociate.deleteAssociate, { kode });

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error: any) {
    console.error('Error deleting associate:', error);
    return { success: false, message: error.message || 'Gagal menghapus associate' };
  }
}
