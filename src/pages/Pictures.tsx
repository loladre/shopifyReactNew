import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Image as ImageIcon,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  FileImage,
  ExternalLink,
  CheckCircle,
  X,
  Eye,
  Search,
  Filter,
} from "lucide-react";

interface PictureError {
  productId: string;
  fileName: string;
  url: string;
  errorType: string;
  fileSize?: number;
  uploadDate?: string;
}

export default function Pictures() {
  const navigate = useNavigate();

  // State
  const [pictureErrors, setPictureErrors] = useState<PictureError[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<PictureError[]>([]);
  const [selectedErrorType, setSelectedErrorType] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    fetchPictureErrors();
  }, []);

  useEffect(() => {
    filterErrorsByType();
  }, [selectedErrorType, pictureErrors]);

  const fetchPictureErrors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/getPicturesWithErrors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch picture errors");
      }

      const data: PictureError[] = await response.json();
      setPictureErrors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filterErrorsByType = () => {
    if (selectedErrorType === "All") {
      setFilteredErrors(pictureErrors);
    } else {
      setFilteredErrors(pictureErrors.filter((error) => error.errorType === selectedErrorType));
    }
  };

  const handleDeletePicture = async (picture: PictureError) => {
    if (!window.confirm(`Are you sure you want to delete "${picture.fileName}"?`)) {
      return;
    }

    try {
      setIsDeleting(picture.productId);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/deletePicturesWithErrors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(picture),
      });

      if (!response.ok) {
        throw new Error("Failed to delete picture");
      }

      const result = await response.json();

      if (result.message === "Deleted Successfully") {
        // Remove the deleted picture from the state
        setPictureErrors((prev) => prev.filter((p) => p.productId !== picture.productId));
        setSuccess(`Successfully deleted "${picture.fileName}"`);
      } else {
        throw new Error("Delete operation was not successful");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete picture");
    } finally {
      setIsDeleting("");
    }
  };

  const handleDownload = (picture: PictureError) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = picture.url;
    link.download = picture.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewImage = (picture: PictureError) => {
    window.open(picture.url, "_blank");
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getErrorTypeColor = (errorType: string): string => {
    switch (errorType.toLowerCase()) {
      case "upload_failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "format_error":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "size_error":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "corruption":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const columns: Column[] = [
    {
      key: "errorType",
      header: "Error Type",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded border text-xs font-medium ${getErrorTypeColor(value)}`}
        >
          {value.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    {
      key: "productId",
      header: "Product ID",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <FileImage className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "fileName",
      header: "File Name",
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm max-w-xs truncate" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: "image",
      header: "Preview",
      render: (_, picture) => (
        <div className="flex justify-center">
          {picture.url ? (
            <div className="relative group">
              <img
                src={picture.url}
                alt={picture.fileName}
                className="w-16 h-16 object-cover rounded border border-slate-200 cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => handleViewImage(picture)}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
      ),
      className: "text-center",
    },
    {
      key: "fileSize",
      header: "File Size",
      sortable: true,
      render: (value) => formatFileSize(value),
      className: "text-center",
    },
    {
      key: "uploadDate",
      header: "Upload Date",
      sortable: true,
      render: (value) => formatDate(value),
      className: "text-center",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, picture) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewImage(picture)}
            title="View Image"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownload(picture)}
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeletePicture(picture)}
            isLoading={isDeleting === picture.productId}
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "text-center",
    },
  ];

  // Calculate summary statistics
  const totalErrors = pictureErrors.length;
  const errorTypes = Array.from(new Set(pictureErrors.map((error) => error.errorType)));
  const totalFileSize = pictureErrors.reduce((sum, error) => sum + (error.fileSize || 0), 0);
  const filteredCount = filteredErrors.length;

  // Get error type counts
  const errorTypeCounts = errorTypes.reduce((acc, type) => {
    acc[type] = pictureErrors.filter((error) => error.errorType === type).length;
    return acc;
  }, {} as Record<string, number>);

  if (error && pictureErrors.length === 0) {
    return (
      <Layout title="Pictures with Errors">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Error Loading Picture Errors
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchPictureErrors}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pictures with Errors">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pictures with Errors</h1>
            <p className="text-slate-600 mt-1">
              Manage and fix product pictures that encountered upload errors
            </p>
          </div>
          <Button onClick={fetchPictureErrors} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Total Errors"
                value={totalErrors}
                icon={AlertTriangle}
                color="red"
              />
              <StatusCard
                title="Error Types"
                value={errorTypes.length}
                icon={FileImage}
                color="orange"
              />
              <StatusCard
                title="Filtered Results"
                value={filteredCount}
                icon={Filter}
                color="blue"
              />
              <StatusCard
                title="Total File Size"
                value={formatFileSize(totalFileSize)}
                icon={ImageIcon}
                color="purple"
              />
            </div>

            {/* Status Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={() => setError("")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {success && (
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{success}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccess("")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Error Type Filter */}
            {errorTypes.length > 0 && (
              <Card>
                <div className="flex items-center space-x-4">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <label htmlFor="errorTypeSelect" className="text-sm font-semibold text-slate-700">
                    Filter by Error Type:
                  </label>
                  <select
                    id="errorTypeSelect"
                    value={selectedErrorType}
                    onChange={(e) => setSelectedErrorType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="All">All Error Types</option>
                    {errorTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()} ({errorTypeCounts[type]})
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )}

            {/* Error Type Breakdown */}
            {errorTypes.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Error Type Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {errorTypes.map((type) => (
                      <div
                        key={type}
                        className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                        onClick={() => setSelectedErrorType(type)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-1 rounded border text-xs font-medium ${getErrorTypeColor(
                              type
                            )}`}
                          >
                            {type.replace("_", " ").toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {errorTypeCounts[type]}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {((errorTypeCounts[type] / totalErrors) * 100).toFixed(1)}% of total
                          errors
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Picture Errors Table */}
            <DataTable
              columns={columns}
              data={filteredErrors}
              emptyMessage={isLoading ? "Loading picture errors..." : "No picture errors found"}
            />

            {/* Empty State */}
            {!isLoading && pictureErrors.length === 0 && (
              <Card className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No Picture Errors Found
                </h3>
                <p className="text-slate-600 mb-6">
                  Great! All product pictures have been uploaded successfully without any errors.
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-2">This page helps you:</p>
                  <ul className="space-y-1">
                    <li>• Identify pictures that failed to upload properly</li>
                    <li>• Download problematic images for manual fixing</li>
                    <li>• Remove corrupted or invalid image files</li>
                    <li>• Monitor upload error patterns and types</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Loading Picture Errors
                </h3>
                <p className="text-slate-600">
                  Please wait while we fetch the picture error information...
                </p>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">How to Fix Picture Errors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Common Error Types</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>
                        • <strong>Upload Failed:</strong> Network or server issues during upload
                      </li>
                      <li>
                        • <strong>Format Error:</strong> Unsupported file format or corrupted file
                      </li>
                      <li>
                        • <strong>Size Error:</strong> File too large or dimensions incorrect
                      </li>
                      <li>
                        • <strong>Corruption:</strong> File data is corrupted or incomplete
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Resolution Steps</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Download the problematic image file</li>
                      <li>• Check file format (JPG, PNG, WebP recommended)</li>
                      <li>• Verify file size and dimensions meet requirements</li>
                      <li>• Re-upload the corrected image manually</li>
                      <li>• Delete the error entry once resolved</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bulk Actions */}
            {filteredErrors.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Bulk Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        filteredErrors.forEach((picture) => {
                          setTimeout(() => handleDownload(picture), 100);
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All ({filteredErrors.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open("/pictures/bulk-upload", "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Bulk Upload Tool
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Use bulk actions to efficiently manage multiple picture errors at once.
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Server Messages Panel */}
          <div className="lg:col-span-1">
            <ServerMessagePanel className="h-[600px]" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
