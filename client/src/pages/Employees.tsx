import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Mail, MapPin, Calendar as CalendarIcon, Briefcase, User, Building2, Phone, FileText, Upload, X, Check, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api, Employee, KycDocument, auth } from "@/lib/supabase";

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinDate, setJoinDate] = useState<Date | undefined>(undefined);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Step validation functions
  const isBasicInfoValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      joinDate !== undefined &&
      formData.designation.trim() !== "" &&
      formData.salary.trim() !== "" &&
      formData.status !== ""
    );
  };

  const isKycDetailsValid = () => {
    return (
      formData.aadhaarNumber.trim() !== "" &&
      formData.panNumber.trim() !== "" &&
      formData.phoneNumber.trim() !== "" &&
      formData.dateOfBirth.trim() !== ""
    );
  };

  const isBankDetailsValid = () => {
    return (
      formData.bankAccountNumber.trim() !== "" &&
      formData.ifscCode.trim() !== "" &&
      formData.bankName.trim() !== "" &&
      formData.bankBranch.trim() !== ""
    );
  };

  const isEmergencyDetailsValid = () => {
    return (
      formData.emergencyContactName.trim() !== "" &&
      formData.emergencyContactPhone.trim() !== "" &&
      formData.emergencyContactRelation.trim() !== "" &&
      formData.nomineeName.trim() !== "" &&
      formData.nomineeRelation.trim() !== "" &&
      formData.nomineeAadhaar.trim() !== ""
    );
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: return isBasicInfoValid();
      case 1: return isKycDetailsValid();
      case 2: return isBankDetailsValid();
      case 3: return isEmergencyDetailsValid();
      default: return true;
    }
  };

  const canGoToNextStep = () => {
    if (editingEmployee) {
      // When editing, allow navigation to next step regardless of validation
      return currentStep < 3;
    }
    // When creating new employee, require validation
    return currentStep < 3 && isCurrentStepValid();
  };

  const canGoToPreviousStep = () => {
    return currentStep > 0;
  };

  const handleNextStep = () => {
    if (canGoToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (canGoToPreviousStep()) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    const steps = [
      { title: "Basic Info", icon: <User className="h-4 w-4 mr-2" /> },
      { title: "KYC Details", icon: <FileText className="h-4 w-4 mr-2" /> },
      { title: "Bank Details", icon: <Building2 className="h-4 w-4 mr-2" /> },
      { title: "Emergency", icon: <Phone className="h-4 w-4 mr-2" /> }
    ];
    return steps[currentStep] || steps[0];
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    joiningDate: "",
    designation: "",
    agreementRefId: "",
    salary: "",
    status: "active" as "active" | "inactive",
    
    // KYC fields
    aadhaarNumber: "",
    panNumber: "",
    phoneNumber: "",
    dateOfBirth: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
    bankBranch: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeAadhaar: "",
  });

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      address: "",
      joiningDate: "",
      designation: "",
      agreementRefId: "",
      salary: "",
      status: "active",
      aadhaarNumber: "",
      panNumber: "",
      phoneNumber: "",
      dateOfBirth: "",
      bankAccountNumber: "",
      ifscCode: "",
      bankName: "",
      bankBranch: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      nomineeName: "",
      nomineeRelation: "",
      nomineeAadhaar: "",
    });
    setJoinDate(undefined);
    setEditingEmployee(null);
    setKycDocuments([]);
    setCurrentStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submit triggered:', {
      editingEmployee: !!editingEmployee,
      currentStep,
      isSubmitting,
      timestamp: new Date().toISOString()
    });
    
    if (!joinDate) {
      toast.error("Please select a joining date");
      return;
    }
    
    // Validate all required fields for new employee creation
    if (!editingEmployee) {
      if (currentStep !== 3) {
        toast.error("Please complete all steps before creating employee");
        return;
      }
      if (!isBasicInfoValid() || !isKycDetailsValid() || !isBankDetailsValid() || !isEmergencyDetailsValid()) {
        toast.error("Please complete all required fields in all steps");
        return;
      }
    }
    
    const data: any = {
      name: formData.name,
      email: formData.email,
      address: formData.address || undefined,
      joiningDate: joinDate.toISOString(),
      designation: formData.designation,
      agreementRefId: formData.agreementRefId || undefined,
      salary: parseInt(formData.salary),
      status: formData.status,
      // KYC fields
      aadhaarNumber: formData.aadhaarNumber || undefined,
      panNumber: formData.panNumber || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      bankAccountNumber: formData.bankAccountNumber || undefined,
      ifscCode: formData.ifscCode || undefined,
      bankName: formData.bankName || undefined,
      bankBranch: formData.bankBranch || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      emergencyContactRelation: formData.emergencyContactRelation || undefined,
      nomineeName: formData.nomineeName || undefined,
      nomineeRelation: formData.nomineeRelation || undefined,
      nomineeAadhaar: formData.nomineeAadhaar || undefined,
    };

    try {
      setIsSubmitting(true);
      console.log('Submitting employee data:', data);
      
      // Additional validation for debugging
      if (!editingEmployee) {
        console.log('Validation check:');
        console.log('- Basic Info Valid:', isBasicInfoValid());
        console.log('- KYC Details Valid:', isKycDetailsValid());
        console.log('- Bank Details Valid:', isBankDetailsValid());
        console.log('- Emergency Details Valid:', isEmergencyDetailsValid());
        console.log('- Current Step:', currentStep);
      }
      
      let result;
      
      if (editingEmployee) {
        console.log('Updating employee:', editingEmployee.id);
        result = await api.updateEmployee(editingEmployee.id, data);
      } else {
        console.log('Creating new employee');
        result = await api.createEmployee(data);
      }

      console.log('API result:', result);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        resetForm();
        // Refresh employees list
        const updatedEmployees = await api.getEmployees();
        setEmployees(updatedEmployees);
      } else {
        toast.error(result.message);
        console.error('API error:', result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (employee: any) => {
    setEditingEmployee(employee);
    const joinDateValue = new Date(employee.joiningDate);
    setJoinDate(joinDateValue);
    
    // Format date of birth for input field
    let dateOfBirthValue = "";
    if (employee.dateOfBirth) {
      const dob = new Date(employee.dateOfBirth);
      dateOfBirthValue = dob.toISOString().split('T')[0];
    }
    
    setFormData({
      name: employee.name,
      email: employee.email,
      address: employee.address || "",
      joiningDate: joinDateValue.toISOString().split('T')[0],
      designation: employee.designation,
      agreementRefId: employee.agreementRefId || "",
      salary: employee.salary.toString(),
      status: employee.status,
      // KYC fields
      aadhaarNumber: employee.aadhaarNumber || "",
      panNumber: employee.panNumber || "",
      phoneNumber: employee.phoneNumber || "",
      dateOfBirth: dateOfBirthValue,
      bankAccountNumber: employee.bankAccountNumber || "",
      ifscCode: employee.ifscCode || "",
      bankName: employee.bankName || "",
      bankBranch: employee.bankBranch || "",
      emergencyContactName: employee.emergencyContactName || "",
      emergencyContactPhone: employee.emergencyContactPhone || "",
      emergencyContactRelation: employee.emergencyContactRelation || "",
      nomineeName: employee.nomineeName || "",
      nomineeRelation: employee.nomineeRelation || "",
      nomineeAadhaar: employee.nomineeAadhaar || "",
    });
    
    // Load KYC documents
    if (employee.id) {
      const docs = await api.getKycDocuments(employee.id);
      setKycDocuments(docs);
    }
    
    setCurrentStep(3); // Start on last step when editing to show all information
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        const result = await api.deleteEmployee(id);
        if (result.success) {
          toast.success(result.message);
          // Refresh employees list
          const updatedEmployees = await api.getEmployees();
          setEmployees(updatedEmployees);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!editingEmployee?.id) {
      toast.error("Please save employee first before uploading documents");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    try {
      setUploadingDocument(true);
      const result = await api.uploadKycDocument(editingEmployee.id, file, documentType);
      
      if (result.success) {
        toast.success("Document uploaded successfully");
        // Reload documents
        const docs = await api.getKycDocuments(editingEmployee.id);
        setKycDocuments(docs);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocument(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      console.log('Attempting to delete document:', documentId);
      
      // Debug the document first
      const debugResult = await api.debugDocument(documentId);
      if (debugResult.success) {
        console.log('Document debug info:', debugResult.data);
      } else {
        console.error('Debug failed:', debugResult.error);
      }

      const result = await api.deleteKycDocument(documentId);
      
      if (result.success) {
        toast.success("Document deleted successfully");
        // Reload documents
        if (editingEmployee?.id) {
          const docs = await api.getKycDocuments(editingEmployee.id);
          setKycDocuments(docs);
        }
      } else {
        toast.error(result.message);
        console.error('Delete failed:', result.message);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Failed to delete document");
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const result = await api.getDocumentSignedUrl(filePath);
      
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error(result.error || "Failed to open document");
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error("Failed to open document");
    }
  };

  const handleVerifyDocument = async (documentId: number, verified: boolean, event?: React.MouseEvent) => {
    // Prevent form submission and event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setIsVerifying(true);
      
      // Get current user ID for verification
      const { user } = await auth.getCurrentUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const result = await api.verifyKycDocument(
        documentId, 
        parseInt(user.id), // Use Supabase user ID
        verified,
        verified ? undefined : "Document rejected"
      );
      
      if (result.success) {
        toast.success(verified ? "Document verified successfully" : "Document rejected");
        // Reload documents
        if (editingEmployee?.id) {
          const docs = await api.getKycDocuments(editingEmployee.id);
          setKycDocuments(docs);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error("Failed to verify document");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage your employee records</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { 
            // Prevent closing during verification operations
            if (!val && isVerifying) {
              return;
            }
            setOpen(val); 
            if (!val) resetForm(); 
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                {/* Step Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${
                            step === currentStep
                              ? 'bg-blue-600 text-white'
                              : step < currentStep
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          onClick={() => {
                            if (editingEmployee) {
                              // Allow direct navigation when editing
                              setCurrentStep(step);
                            } else if (step <= currentStep) {
                              // When creating, only allow going back or staying on current step
                              setCurrentStep(step);
                            }
                          }}
                        >
                          {step + 1}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      Step {currentStep + 1} of 4: {getStepTitle().icon}{getStepTitle().title}
                    </span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className={`w-full justify-start text-left font-normal ${!joinDate && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {joinDate ? format(joinDate, "dd-MM-yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={joinDate}
                          onSelect={(date) => {
                            setJoinDate(date);
                            if (date) {
                              setFormData({ ...formData, joiningDate: format(date, "yyyy-MM-dd") });
                            }
                          }}
                          captionLayout="dropdown"
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 1}
                          formatters={{
                            formatMonth: (date) => date.toLocaleString('en', { month: 'long' }),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) => setFormData({ ...formData, designation: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cognitive Architecture">Cognitive Architecture</SelectItem>
                        <SelectItem value="Cognitive Vector">Cognitive Vector</SelectItem>
                        <SelectItem value="Cognitive Intelligence">Cognitive Intelligence</SelectItem>
                        <SelectItem value="Cognitive Interface">Cognitive Interface</SelectItem>
                        <SelectItem value="Quantum Coder">Quantum Coder</SelectItem>
                        <SelectItem value="Truth Miner- Data Scientist">Truth Miner- Data Scientist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agreementRefId">Agreement Reference ID</Label>
                  <Input
                    id="agreementRefId"
                    value={formData.agreementRefId}
                    onChange={(e) => setFormData({ ...formData, agreementRefId: e.target.value })}
                    placeholder="Contract/Agreement ID"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Payment (₹) *</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">KYC Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                        <Input
                          id="aadhaarNumber"
                          value={formData.aadhaarNumber}
                          onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                          maxLength={12}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number *</Label>
                        <Input
                          id="panNumber"
                          value={formData.panNumber}
                          onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* KYC Documents Upload Section - Only show if editing */}
                    {editingEmployee && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <h3 className="font-semibold">KYC Documents</h3>
                        
                        {/* Upload buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['aadhaar', 'pan', 'passport', 'address_proof', 'bank_statement', 'profile_photo'].map((docType) => {
                            const displayName = docType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            return (
                              <label key={docType} className="flex items-center justify-center p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="h-4 w-4 mr-2" />
                                <span className="text-sm">{displayName}</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, docType)}
                                  disabled={uploadingDocument}
                                  className="hidden"
                                />
                              </label>
                            );
                          })}
                        </div>

                        {/* Uploaded documents list */}
                        {kycDocuments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Uploaded Documents:</h4>
                            {kycDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3 flex-1">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <p className="font-medium">{doc.documentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {doc.documentType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''} • 
                                      {format(new Date(doc.uploadDate), "dd MMM yyyy")}
                                    </p>
                                  </div>
                                  {doc.verified ? (
                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                      <Check className="h-4 w-4" /> Verified
                                    </span>
                                  ) : (
                                    <span className="text-orange-600 text-sm">Pending</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewDocument(doc.fileUrl);
                                    }}
                                    title="View Document"
                                    type="button"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!doc.verified && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => handleVerifyDocument(doc.id, true, e)}
                                        className="text-green-600 hover:text-green-700"
                                        title="Verify Document"
                                        disabled={isVerifying}
                                        type="button"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => handleVerifyDocument(doc.id, false, e)}
                                        className="text-red-600 hover:text-red-700"
                                        title="Reject Document"
                                        disabled={isVerifying}
                                        type="button"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteDocument(doc.id);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                    title="Delete Document"
                                    type="button"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!editingEmployee && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          KYC documents can be uploaded after creating the employee record.
                        </p>
                      </div>
                    )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                        <Input
                          id="bankAccountNumber"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                          placeholder="Bank account number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">IFSC Code *</Label>
                        <Input
                          id="ifscCode"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                          placeholder="XXXX0XXXXX"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="Bank name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankBranch">Bank Branch *</Label>
                        <Input
                          id="bankBranch"
                          value={formData.bankBranch}
                          onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                          placeholder="Branch name"
                        />
                      </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Emergency Contact & Nominee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                        <Input
                          id="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactRelation">Emergency Contact Relation *</Label>
                      <Input
                        id="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                        placeholder="e.g., Spouse, Parent, Sibling"
                      />
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-4">Nominee Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomineeName">Nominee Name *</Label>
                          <Input
                            id="nomineeName"
                            value={formData.nomineeName}
                            onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                            placeholder="Nominee name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nomineeRelation">Nominee Relation *</Label>
                          <Input
                            id="nomineeRelation"
                            value={formData.nomineeRelation}
                            onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                            placeholder="Relation to nominee"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="nomineeAadhaar">Nominee Aadhaar *</Label>
                        <Input
                          id="nomineeAadhaar"
                          value={formData.nomineeAadhaar}
                          onChange={(e) => setFormData({ ...formData, nomineeAadhaar: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                          maxLength={12}
                        />
                      </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <div className="flex gap-2">
                    {canGoToPreviousStep() && (
                      <Button type="button" variant="outline" onClick={handlePreviousStep}>
                        Previous
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        if (!isVerifying) {
                          setOpen(false);
                        }
                      }}
                      disabled={isVerifying}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {editingEmployee ? (
                      <>
                        {canGoToNextStep() ? (
                          <Button type="button" onClick={handleNextStep}>
                            Next
                          </Button>
                        ) : currentStep === 3 ? (
                          <Button 
                            type="button" 
                            disabled={isSubmitting}
                            onClick={async (e) => {
                              console.log('Update Employee button clicked');
                              e.preventDefault();
                              setIsSubmitting(true);
                              await handleSubmit(e as any);
                            }}
                          >
                            {isSubmitting ? "Updating..." : "Update Employee"}
                          </Button>
                        ) : (
                          <Button type="button" disabled>
                            Complete Required Fields
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {canGoToNextStep() ? (
                          <Button type="button" onClick={handleNextStep}>
                            Next
                          </Button>
                        ) : currentStep === 3 && isEmergencyDetailsValid() ? (
                          <Button 
                            type="button" 
                            disabled={isSubmitting}
                            onClick={async (e) => {
                              console.log('Create Employee button clicked');
                              e.preventDefault();
                              setIsSubmitting(true);
                              await handleSubmit(e as any);
                            }}
                          >
                            {isSubmitting ? "Creating..." : "Create Employee"}
                          </Button>
                        ) : (
                          <Button type="button" disabled>
                            Complete Required Fields
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bento-card animate-pulse">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <div key={employee.id} className="bento-card group">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            employee.status === "active"
                              ? "bg-[rgb(var(--tea))]/10 text-[rgb(var(--tea))]"
                              : "bg-[rgb(var(--red-passion))]/10 text-[rgb(var(--red-passion))]"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{employee.designation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    {employee.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{employee.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Joined {formatDate(employee.joiningDate)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Salary</span>
                      <span className="font-semibold text-lg">{formatCurrency(employee.salary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-card text-center py-12">
            <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

