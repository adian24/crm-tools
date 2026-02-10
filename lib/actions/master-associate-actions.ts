"use server";

import fs from 'fs/promises';
import path from 'path';

export interface Associate {
  kode: string;
  nama: string;
  kategori: 'Direct' | 'Associate';
  status: 'Aktif' | 'Non-Aktif';
}

const filePath = path.join(process.cwd(), 'data', 'master-associate.json');

// Read all associates
export async function getAssociates(): Promise<Associate[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.associate || [];
  } catch (error) {
    console.error('Error reading associate data:', error);
    return [];
  }
}

// Add new associate
export async function addAssociate(associate: Omit<Associate, 'kode'>): Promise<{ success: boolean; message: string; data?: Associate }> {
  try {
    const associates = await getAssociates();

    // Generate new kode (ASS + next number)
    const maxCode = associates.reduce((max, assoc) => {
      const num = parseInt(assoc.kode.replace('ASS', ''));
      return num > max ? num : max;
    }, 0);

    const newKode = `ASS${String(maxCode + 1).padStart(3, '0')}`;

    const newAssociate: Associate = {
      kode: newKode,
      ...associate,
    };

    associates.push(newAssociate);

    // Sort by kode
    associates.sort((a, b) => a.kode.localeCompare(b.kode));

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify({ associate: associates }, null, 2), 'utf-8');

    return { success: true, message: 'Associate berhasil ditambahkan', data: newAssociate };
  } catch (error) {
    console.error('Error adding associate:', error);
    return { success: false, message: 'Gagal menambahkan associate' };
  }
}

// Update associate
export async function updateAssociate(kode: string, associate: Omit<Associate, 'kode'>): Promise<{ success: boolean; message: string }> {
  try {
    const associates = await getAssociates();
    const index = associates.findIndex(a => a.kode === kode);

    if (index === -1) {
      return { success: false, message: 'Associate tidak ditemukan' };
    }

    // Update associate
    associates[index] = {
      kode,
      ...associate,
    };

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify({ associate: associates }, null, 2), 'utf-8');

    return { success: true, message: 'Associate berhasil diupdate' };
  } catch (error) {
    console.error('Error updating associate:', error);
    return { success: false, message: 'Gagal mengupdate associate' };
  }
}

// Delete associate
export async function deleteAssociate(kode: string): Promise<{ success: boolean; message: string }> {
  try {
    const associates = await getAssociates();
    const filteredAssociates = associates.filter(a => a.kode !== kode);

    if (filteredAssociates.length === associates.length) {
      return { success: false, message: 'Associate tidak ditemukan' };
    }

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify({ associate: filteredAssociates }, null, 2), 'utf-8');

    return { success: true, message: 'Associate berhasil dihapus' };
  } catch (error) {
    console.error('Error deleting associate:', error);
    return { success: false, message: 'Gagal menghapus associate' };
  }
}
