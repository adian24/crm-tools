"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Phone, Mail, User, Building, Save, X, Building2, Briefcase, ChevronDown, ChevronUp, Filter, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import { InfinityLoader } from '@/components/ui/infinity-loader';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ContactData {
  _id: Id<"crmTargets">;
  namaPerusahaan: string;
  noTelp?: string;
  email?: string;
  namaKonsultan?: string;
  noTelpKonsultan?: string;
  emailKonsultan?: string;
  picCrm: string;
  provinsi: string;
  kota: string;
  createdAt: number;
  updatedAt: number;
}

interface GroupedContact {
  namaPerusahaan: string;
  contacts: ContactData[];
}

export default function KontakManagementPage() {
  // Mobile detection
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPicCrm, setSelectedPicCrm] = useState<string>('All');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<GroupedContact | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'pic' | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`✅ ${label} berhasil disalin!`);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      toast.error('❌ Gagal menyalin ke clipboard');
    }
  };

  // Fetch CRM targets
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);

  // Loading state
  const isLoading = crmTargets === undefined || allUsers === undefined;

  // Get current user with role and permissions
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [canEdit, setCanEdit] = React.useState(true);

  React.useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
        setCanEdit(true); // All users can edit contact info

        // Auto-set PIC filter for staff
        if (parsedUser?.role === 'staff') {
          const userPicCode = parsedUser?.name?.toUpperCase() || parsedUser?.email?.split('@')[0]?.toUpperCase();
          if (userPicCode && userPicCode !== 'STAFF') {
            setSelectedPicCrm(userPicCode);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setCanEdit(true);
    }
  }, []);

  // Filter CRM targets based on logged-in user
  const filteredCrmTargets = React.useMemo(() => {
    if (!crmTargets) return [];

    // Admin and super_admin: view all data
    if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
      return crmTargets;
    }

    // Manager: view all data
    if (currentUser?.role === 'manager') {
      return crmTargets;
    }

    // Staff: filter by their PIC CRM
    if (currentUser?.role === 'staff') {
      // Get user's PIC code from name or email
      const userPicCode = currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase();

      if (userPicCode && userPicCode !== 'STAFF') {
        // Note: We can't use setState in useMemo, so filter directly
        // Filter CRM targets by user's PIC code
        return crmTargets.filter(target => target.picCrm === userPicCode);
      }

      // If no valid PIC code, show all (fallback)
      return crmTargets;
    }

    return crmTargets;
  }, [crmTargets, currentUser]);

  // Get unique PIC CRM list
  // For staff, only show their own PIC
  const uniquePicCrms = React.useMemo(() => {
    if (currentUser?.role === 'staff') {
      const userPicCode = currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase();
      if (userPicCode && userPicCode !== 'STAFF') {
        return [userPicCode];
      }
    }

    const pics = new Set<string>();
    filteredCrmTargets?.forEach(target => {
      if (target.picCrm && target.picCrm.trim() !== '') {
        pics.add(target.picCrm);
      }
    });
    return Array.from(pics).sort();
  }, [filteredCrmTargets, currentUser]);

  // Extract unique contact data grouped by company name
  const groupedContacts = React.useMemo(() => {
    const groups: { [key: string]: ContactData[] } = {};

    filteredCrmTargets?.forEach(target => {
      // Skip if namaPerusahaan is missing
      if (!target.namaPerusahaan || target.namaPerusahaan.trim() === '') {
        return;
      }

      const companyName = target.namaPerusahaan;

      if (!groups[companyName]) {
        groups[companyName] = [];
      }

      // Add ALL companies (not only ones with contact info)
      groups[companyName].push({
        _id: target._id,
        namaPerusahaan: target.namaPerusahaan || '-',
        noTelp: target.noTelp,
        email: target.email,
        namaKonsultan: target.namaKonsultan,
        noTelpKonsultan: target.noTelpKonsultan,
        emailKonsultan: target.emailKonsultan,
        picCrm: target.picCrm || '-',
        provinsi: target.provinsi || '-',
        kota: target.kota || '-',
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      });
    });

    // Convert to array and sort by company name
    return Object.entries(groups)
      .map(([namaPerusahaan, contacts]) => ({
        namaPerusahaan,
        contacts,
      }))
      .sort((a, b) => a.namaPerusahaan.localeCompare(b.namaPerusahaan));
  }, [filteredCrmTargets]);

  // Filter by search term and PIC CRM
  const filteredGroups = React.useMemo(() => {
    let result = groupedContacts;

    // Filter by PIC CRM
    if (selectedPicCrm !== 'All') {
      result = result.filter(group =>
        group.contacts.some(contact => contact.picCrm === selectedPicCrm)
      );
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(group => {
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch =
          (group.namaPerusahaan && group.namaPerusahaan.toLowerCase().includes(searchLower)) ||
          group.contacts.some(contact =>
            (contact.noTelp && contact.noTelp.toLowerCase().includes(searchLower)) ||
            (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
            (contact.namaKonsultan && contact.namaKonsultan.toLowerCase().includes(searchLower)) ||
            (contact.noTelpKonsultan && contact.noTelpKonsultan.toLowerCase().includes(searchLower)) ||
            (contact.emailKonsultan && contact.emailKonsultan.toLowerCase().includes(searchLower)) ||
            (contact.picCrm && contact.picCrm.toLowerCase().includes(searchLower)) ||
            (contact.kota && contact.kota.toLowerCase().includes(searchLower))
          );

        return matchesSearch;
      });
    }

    return result;
  }, [groupedContacts, searchTerm, selectedPicCrm]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle update
  const handleUpdateContact = async (data: any) => {
    if (!selectedContact) return;

    setIsUpdating(true);
    try {
      // Update all CRM targets with the same company name
      let successCount = 0;
      let errorCount = 0;

      for (const contact of selectedContact.contacts) {
        try {
          // Convert empty strings to null to unset the field
          await updateTargetMutation({
            id: contact._id,
            noTelp: data.noTelp?.trim() || null,
            email: data.email?.trim() || null,
            namaKonsultan: data.namaKonsultan?.trim() || null,
            noTelpKonsultan: data.noTelpKonsultan?.trim() || null,
            emailKonsultan: data.emailKonsultan?.trim() || null,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${contact._id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Berhasil update ${successCount} data kontak!`);
        setIsEditDialogOpen(false);
        setSelectedContact(null);
      }

      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} data gagal diupdate`);
      }
    } catch (error) {
      toast.error('❌ Error mengupdate data kontak');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (group: GroupedContact) => {
    setSelectedContact(group);
    setIsEditDialogOpen(true);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages <= maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Generate color for PIC CRM badge
  const getPicBadgeColor = (picCrm: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'DHA': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
      'MRC': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
      'default': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' }
    };

    return colors[picCrm] || colors['default'];
  };

  // Copyable Text Component
  const CopyableText = ({
    text,
    icon: Icon,
    label,
    className = '',
    iconClassName = ''
  }: {
    text: string;
    icon: any;
    label: string;
    className?: string;
    iconClassName?: string;
  }) => {
    const isCopied = copiedItem === label;
    const hasText = text && text.trim() !== '';

    if (!hasText) {
      return (
        <span className={className}>
          <span className="text-muted-foreground italic">Belum diisi</span>
        </span>
      );
    }

    return (
      <button
        onClick={() => copyToClipboard(text, label)}
        className={`flex items-center gap-1 hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors cursor-pointer group ${className}`}
        title={`Klik untuk copy ${label}`}
      >
        <Icon className={`h-3 w-3 flex-shrink-0 ${iconClassName || 'text-muted-foreground'}`} />
        <span className="truncate">{text}</span>
        {isCopied ? (
          <Check className="h-3 w-3 text-green-600 flex-shrink-0 ml-1" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1 transition-opacity" />
        )}
      </button>
    );
  };

  // Mobile Contact Card Component
  const MobileContactCard = ({ group, index }: { group: GroupedContact; index: number }) => {
    const contact = group.contacts[0];
    if (!contact) return null;

    const hasContactInfo = contact.noTelp || contact.email || contact.namaKonsultan;
    const picColors = getPicBadgeColor(contact.picCrm);

    return (
      <Card className={`hover:shadow-lg transition-all duration-200 ${!hasContactInfo ? 'border-orange-300 bg-orange-50/30 dark:border-orange-700 dark:bg-orange-950/10' : 'hover:border-blue-300'}`}>
        <CardContent className="p-3">
          {/* Header: Company Name & Edit Button */}
          <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                {contact.namaPerusahaan}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(group)}
              disabled={!canEdit}
              className="h-7 w-7 p-0 shrink-0 hover:bg-blue-50 cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          </div>

          {/* Info Rows */}
          <div className="space-y-2 text-[11px]">
            {/* Row 1: PIC & Lokasi */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">PIC:</span>
              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${picColors.bg} ${picColors.text} ${picColors.border}`}>
                {contact.picCrm || '-'}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{contact.kota || '-'}</span>
            </div>

            {/* Row 2: No Telp Perusahaan */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">Telp:</span>
              <CopyableText
                text={contact.noTelp || ''}
                icon={Phone}
                label={`Telp ${contact.namaPerusahaan}`}
                className="flex-1"
              />
            </div>

            {/* Row 3: Email Perusahaan */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">Email:</span>
              <CopyableText
                text={contact.email || ''}
                icon={Mail}
                label={`Email ${contact.namaPerusahaan}`}
                className="flex-1"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            {/* Row 4: Nama Konsultan */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">Kslt:</span>
              <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                {contact.namaKonsultan || <span className="text-muted-foreground italic">Belum diisi</span>}
              </span>
            </div>

            {/* Row 5: No Telp Konsultan */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">Telp:</span>
              <CopyableText
                text={contact.noTelpKonsultan || ''}
                icon={Phone}
                label={`Telp Konsultan ${contact.namaPerusahaan}`}
                className="flex-1"
                iconClassName="text-purple-500"
              />
            </div>

            {/* Row 6: Email Konsultan */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium w-16 shrink-0">Email:</span>
              <CopyableText
                text={contact.emailKonsultan || ''}
                icon={Mail}
                label={`Email Konsultan ${contact.namaPerusahaan}`}
                className="flex-1"
                iconClassName="text-purple-500"
              />
            </div>
          </div>

          {/* Footer Badge */}
          {!hasContactInfo && (
            <div className="mt-2 pt-2 border-t">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 w-full justify-center text-orange-600 border-orange-300">
                Belum ada info kontak
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <InfinityLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Kontak</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi kontak perusahaan dan konsultan
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 grid-cols-3 md:gap-4">
        <Card className="p-2 md:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 md:px-6">
            <CardTitle className="text-[10px] font-medium md:text-sm">Total Perusahaan</CardTitle>
            <Building className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="text-lg font-bold md:text-2xl">{filteredGroups.length}</div>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight md:text-xs md:mt-1">
              {filteredGroups.filter(g => g.contacts.some(c => c.noTelp || c.email || c.namaKonsultan)).length} memiliki info kontak
            </p>
          </CardContent>
        </Card>

        <Card className="p-2 md:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 md:px-6">
            <CardTitle className="text-[10px] font-medium md:text-sm">Total Kontak Perusahaan</CardTitle>
            <Phone className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="text-lg font-bold md:text-2xl">
              {filteredGroups.filter(g => g.contacts.some(c => c.noTelp)).length}
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight md:text-xs md:mt-1">
              Dari {filteredGroups.length} perusahaan
            </p>
          </CardContent>
        </Card>

        <Card className="p-2 md:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 md:px-6">
            <CardTitle className="text-[10px] font-medium md:text-sm">Total Konsultan</CardTitle>
            <User className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="text-lg font-bold md:text-2xl">
              {filteredGroups.filter(g => g.contacts.some(c => c.namaKonsultan)).length}
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight md:text-xs md:mt-1">
              Dari {filteredGroups.length} perusahaan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table with Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Kontak Perusahaan</CardTitle>
              <CardDescription>
                Menampilkan {filteredGroups.length} perusahaan ({filteredGroups.filter(g => g.contacts.some(c => c.noTelp || c.email || c.namaKonsultan)).length} sudah memiliki info kontak)
                {(searchTerm || selectedPicCrm !== 'All') && ' - hasil filter'}
              </CardDescription>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari perusahaan, telepon, email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                {currentUser?.role !== 'staff' && (
                  <Select
                    value={selectedPicCrm}
                    onValueChange={(value) => {
                      setSelectedPicCrm(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter PIC CRM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Semua PIC</SelectItem>
                      {uniquePicCrms.map((pic) => (
                        <SelectItem key={pic} value={pic}>
                          {pic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Copy Info Banner */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-2">
            <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Tips Copy Cepat</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Klik pada nomor telepon atau email untuk menyalin ke clipboard secara otomatis
              </p>
            </div>
          </div>

          {isMobile ? (
            // Mobile Grid View - 1 column
            <div className="grid grid-cols-1 gap-2">
              {paginatedGroups.length === 0 ? (
                <div className="col-span-1 text-center py-12 text-muted-foreground">
                  {searchTerm ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data kontak'}
                </div>
              ) : (
                paginatedGroups.map((group, index) => (
                  <MobileContactCard key={group.namaPerusahaan} group={group} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead>Nama Perusahaan</TableHead>
                    <TableHead>PIC CRM</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>No. Telp</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Konsultan</TableHead>
                    <TableHead>Telp Konsultan</TableHead>
                    <TableHead>Email Konsultan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data kontak'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedGroups.map((group, index) => {
                      // Get first contact as representative
                      const contact = group.contacts[0];

                      // Skip if contact is undefined
                      if (!contact) return null;

                      // Check if has any contact info
                      const hasContactInfo = contact.noTelp || contact.email || contact.namaKonsultan;
                      const picColors = getPicBadgeColor(contact.picCrm);

                      // Calculate row number
                      const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                      return (
                        <TableRow
                          key={group.namaPerusahaan}
                          className={`hover:bg-muted/30 ${!hasContactInfo ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {rowNumber}.
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {contact.namaPerusahaan || '-'}
                              {!hasContactInfo && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  Belum ada kontak
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${picColors.bg} ${picColors.text} ${picColors.border}`}>
                              {contact.picCrm || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{contact.kota || '-'}</div>
                              <div className="text-xs text-muted-foreground">{contact.provinsi || '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CopyableText
                              text={contact.noTelp || ''}
                              icon={Phone}
                              label={`Telp ${contact.namaPerusahaan}`}
                            />
                          </TableCell>
                          <TableCell>
                            <CopyableText
                              text={contact.email || ''}
                              icon={Mail}
                              label={`Email ${contact.namaPerusahaan}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className={`text-sm ${!contact.namaKonsultan ? 'text-muted-foreground italic' : ''}`}>
                                {contact.namaKonsultan || '(belum diisi)'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CopyableText
                              text={contact.noTelpKonsultan || ''}
                              icon={Phone}
                              label={`Telp Konsultan ${contact.namaPerusahaan}`}
                              iconClassName="text-purple-500"
                            />
                          </TableCell>
                          <TableCell>
                            <CopyableText
                              text={contact.emailKonsultan || ''}
                              icon={Mail}
                              label={`Email Konsultan ${contact.namaPerusahaan}`}
                              iconClassName="text-purple-500"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              disabled={!canEdit}
                              className='cursor-pointer'
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Advanced Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredGroups.length)} dari {filteredGroups.length} perusahaan
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
                {/* Items per page */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs sm:text-sm border rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                {/* First & Prev */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-xs"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-xs"
                >
                  Prev
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs">...</span>
                    ) : (
                      <Button
                        key={`page-${pageNum}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(Number(pageNum))}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                </div>

                {/* Next & Last */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-xs"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-xs"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border lg:hidden mb-0`}>
            <div className={`grid gap-1 p-2 ${currentUser?.role === 'staff' ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {/* Search Tab */}
              <button
                onClick={() => setMobileFilterOpen(mobileFilterOpen === 'search' ? null : 'search')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                  mobileFilterOpen === 'search' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <Search className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Cari</span>
              </button>

              {/* PIC Filter Tab - Only for non-staff */}
              {currentUser?.role !== 'staff' && (
                <button
                  onClick={() => setMobileFilterOpen(mobileFilterOpen === 'pic' ? null : 'pic')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                    mobileFilterOpen === 'pic' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">PIC</span>
                </button>
              )}

              {/* Reset Tab */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPicCrm(currentUser?.role === 'staff' ? selectedPicCrm : 'All');
                  setCurrentPage(1);
                  setItemsPerPage(10);
                  toast.success('✅ Filter berhasil direset!');
                }}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors hover:bg-muted bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md"
              >
                <X className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Reset</span>
              </button>
            </div>
          </div>

          {/* Mobile Filter Sheet Overlay */}
          {mobileFilterOpen === 'search' && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-[110] lg:hidden"
                onClick={() => setMobileFilterOpen(null)}
              />

              {/* Filter Sheet */}
              <div className="fixed mb-0 bottom-0 left-0 right-0 z-[120] lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
                {/* Handle bar */}
                <div className="flex justify-center border-b p-3">
                  <div className="w-12 h-1.5 bg-muted rounded-full" />
                </div>

                {/* Filter Content */}
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Cari Kontak</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileFilterOpen(null)}
                        className="h-8 text-xs"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari perusahaan, telepon, email..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setMobileFilterOpen(null);
                            }
                          }}
                        />
                      </div>
                      {searchTerm && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Ditemukan: {filteredGroups.length} hasil</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchTerm('');
                              setCurrentPage(1);
                            }}
                            className="h-7 text-xs"
                          >
                            Hapus
                          </Button>
                        </div>
                      )}
                      <Button
                        onClick={() => setMobileFilterOpen(null)}
                        className="w-full"
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PIC Filter Sheet */}
          {mobileFilterOpen === 'pic' && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-[110] lg:hidden"
                onClick={() => setMobileFilterOpen(null)}
              />

              {/* Filter Sheet */}
              <div className="fixed mb-0 bottom-0 left-0 right-0 z-[120] lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
                {/* Handle bar */}
                <div className="flex justify-center border-b p-3">
                  <div className="w-12 h-1.5 bg-muted rounded-full" />
                </div>

                {/* Filter Content */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filter PIC CRM</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileFilterOpen(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Current Selection Info */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <p>PIC yang dipilih: <span className="font-semibold text-foreground">{selectedPicCrm === 'All' ? 'Semua PIC' : selectedPicCrm}</span></p>
                    <p className="mt-1">
                      Menampilkan <span className="font-bold text-foreground">{filteredGroups.length}</span> perusahaan
                    </p>
                  </div>

                  {/* PIC Options */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Pilih PIC CRM</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* All PIC Button */}
                      <button
                        onClick={() => {
                          setSelectedPicCrm('All');
                          setCurrentPage(1);
                        }}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          selectedPicCrm === 'All'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="text-center">Semua PIC</div>
                        <div className="text-xs opacity-75 mt-1">{groupedContacts.length} perusahaan</div>
                      </button>

                      {/* Individual PIC Buttons */}
                      {uniquePicCrms.map((pic) => {
                        const picColors = getPicBadgeColor(pic);
                        const count = groupedContacts.filter(g => g.contacts.some(c => c.picCrm === pic)).length;
                        return (
                          <button
                            key={pic}
                            onClick={() => {
                              setSelectedPicCrm(pic);
                              setCurrentPage(1);
                            }}
                            className={`p-3 rounded-lg text-sm font-medium transition-all ${
                              selectedPicCrm === pic
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            <div className={`inline-flex px-2 py-0.5 rounded text-xs mb-1 ${picColors.bg} ${picColors.text} ${picColors.border}`}>
                              {pic}
                            </div>
                            <div className="text-xs opacity-75 mt-1">{count} perusahaan</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Mobile Spacer for Bottom Nav */}
      {isMobile && <div className="h-16"></div>}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kontak - {selectedContact?.namaPerusahaan}</DialogTitle>
            <DialogDescription>
              Update informasi kontak untuk {selectedContact?.contacts.length || 0} data CRM
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <EditContactForm
              contact={selectedContact.contacts[0]}
              onSubmit={handleUpdateContact}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedContact(null);
              }}
              isUpdating={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Contact Form Component
interface EditContactFormProps {
  contact: ContactData;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

function EditContactForm({ contact, onSubmit, onCancel, isUpdating }: EditContactFormProps) {
  const [formData, setFormData] = useState({
    noTelp: contact.noTelp || '',
    email: contact.email || '',
    namaKonsultan: contact.namaKonsultan || '',
    noTelpKonsultan: contact.noTelpKonsultan || '',
    emailKonsultan: contact.emailKonsultan || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Contact Info */}
      <div className="space-y-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Kontak Perusahaan</h3>
        </div>
        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 pl-7">Informasi kontak perusahaan klien</p>

        <div className="grid gap-3 pl-7">
          <div className="grid gap-2">
            <Label htmlFor="noTelp" className="text-sm font-medium">No. Telp Perusahaan</Label>
            <Input
              id="noTelp"
              value={formData.noTelp}
              onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
              placeholder="Contoh: 021-12345678"
              className="bg-white dark:bg-gray-900"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Perusahaan</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Contoh: info@perusahaan.com"
              className="bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Consultant Contact Info */}
      <div className="space-y-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base font-semibold text-purple-900 dark:text-purple-100">Kontak Konsultan</h3>
        </div>
        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 pl-7">Informasi kontak konsultan</p>

        <div className="grid gap-3 pl-7">
          <div className="grid gap-2">
            <Label htmlFor="namaKonsultan" className="text-sm font-medium">Nama Konsultan</Label>
            <Input
              id="namaKonsultan"
              value={formData.namaKonsultan}
              onChange={(e) => setFormData({ ...formData, namaKonsultan: e.target.value })}
              placeholder="Nama lengkap konsultan"
              className="bg-white dark:bg-gray-900"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="noTelpKonsultan" className="text-sm font-medium">No. Telp Konsultan</Label>
            <Input
              id="noTelpKonsultan"
              value={formData.noTelpKonsultan}
              onChange={(e) => setFormData({ ...formData, noTelpKonsultan: e.target.value })}
              placeholder="Contoh: 08123456789"
              className="bg-white dark:bg-gray-900"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emailKonsultan" className="text-sm font-medium">Email Konsultan</Label>
            <Input
              id="emailKonsultan"
              type="email"
              value={formData.emailKonsultan}
              onChange={(e) => setFormData({ ...formData, emailKonsultan: e.target.value })}
              placeholder="Contoh: konsultan@example.com"
              className="bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUpdating} className='cursor-pointer'>
          <X className="h-4 w-4 mr-2" />
          Batal
        </Button>
        <Button type="submit" disabled={isUpdating} className='cursor-pointer'>
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
