import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Percent,
  Package,
  Search,
  Plus,
  X,
  DollarSign,
  Building2,
  Calendar,
  Image as ImageIcon,
  Tag,
  Filter,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Eye,
  Settings,
  Loader2,
  Save,
} from "lucide-react";

interface CriteriaLine {
  id: string;
  item: string;
  condition: string;
  conditionTag: string;
  season: string;
  seasonYear: string;
  vendor: string;
  category: string;
  tagInput: string;
  operator?: string;
}

interface BulkDiscountProduct {
  id: string;
  vendor: string;
  title: string;
  handle: string;
  productImage: string;
  totalInventory: number;
  productType: string;
  receivedDate: string;
  price: number;
  compareAtPrice: number;
  currentDiscount: number;
  offers: string;
  newPrice: number;
  newCompareAt: number;
  variants: string[];
  tags: string[];
  excluded: boolean;
  daysSinceReceived: number;
}

export default function BulkDiscount() {
  const navigate = useNavigate();

  // State for criteria building
  const [criteriaLines, setCriteriaLines] = useState<CriteriaLine[]>([
    {
      id: "1",
      item: "",
      condition: "EQUALS",
      conditionTag: "CONTAINS",
      season: "",
      seasonYear: "",
      vendor: "",
      category: "",
      tagInput: "",
    },
  ]);

  // State for products and filtering
  const [products, setProducts] = useState<BulkDiscountProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BulkDiscountProduct[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // State for filters
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [excludeNotReceived, setExcludeNotReceived] = useState(false);
  const [excludeNoPictures, setExcludeNoPictures] = useState(false);
  const [excludeDiscountAbove, setExcludeDiscountAbove] = useState(false);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(0);

  // State for discount application
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountName, setDiscountName] = useState<string>("");
  const [saleName, setSaleName] = useState<string>("");
  const [generatedSeason, setGeneratedSeason] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [discountApplied, setDiscountApplied] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    products,
    excludeOutOfStock,
    excludeNotReceived,
    excludeNoPictures,
    excludeDiscountAbove,
    maxDiscountPercent,
  ]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }

      const data: string[] = await response.json();
      setVendors(data.sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/productTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data: string[] = await response.json();
      setCategories(data.sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    }
  };

  const addCriteriaLine = () => {
    const newId = (criteriaLines.length + 1).toString();
    const newLine: CriteriaLine = {
      id: newId,
      item: "",
      condition: "EQUALS",
      conditionTag: "CONTAINS",
      season: "",
      seasonYear: "",
      vendor: "",
      category: "",
      tagInput: "",
      operator: "AND",
    };
    setCriteriaLines([...criteriaLines, newLine]);
  };

  const removeCriteriaLine = (id: string) => {
    if (criteriaLines.length > 1) {
      setCriteriaLines(criteriaLines.filter((line) => line.id !== id));
    }
  };

  const updateCriteriaLine = (id: string, field: keyof CriteriaLine, value: string) => {
    setCriteriaLines(
      criteriaLines.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const generateQuery = (): string => {
    let queryParts: string[] = [];

    criteriaLines.forEach((line) => {
      if (!line.item) return;

      let itemType = line.item;
      let condition = line.condition;
      let conditionTag = line.conditionTag;
      let value = "";
      let querySegment = "";

      switch (itemType) {
        case "Category":
          itemType = "product_type";
          value = line.category ? line.category + "*" : "";
          querySegment =
            condition === "EQUALS" ? `${itemType}:'${value}'` : `NOT ${itemType}:'${value}'`;
          break;
        case "Vendor":
          itemType = "vendor";
          value = line.vendor;
          querySegment =
            condition === "EQUALS" ? `${itemType}:'${value}'` : `NOT ${itemType}:'${value}'`;
          break;
        case "Season":
          itemType = "tag";
          value = line.season + line.seasonYear;
          querySegment =
            condition === "EQUALS" ? `${itemType}:'${value}'` : `NOT ${itemType}:'${value}'`;
          break;
        case "Tag":
        case "Title":
          itemType = itemType.toLowerCase();
          value = line.tagInput.trim() + "*";
          querySegment =
            conditionTag === "CONTAINS" ? `${itemType}:'${value}'` : `NOT ${itemType}:'${value}'`;
          break;
      }

      if (querySegment) {
        queryParts.push(querySegment);
      }
    });

    // Join with operators
    let finalQuery = '"';
    for (let i = 0; i < queryParts.length; i++) {
      finalQuery += queryParts[i];
      if (i < queryParts.length - 1 && criteriaLines[i + 1]?.operator) {
        finalQuery += ` ${criteriaLines[i + 1].operator} `;
      }
    }
    finalQuery += ' AND status:active"';

    // Generate discount name
    const generatedDiscountName = generateDiscountName(finalQuery);
    setDiscountName(generatedDiscountName);
    setGeneratedSeason(finalQuery);

    return finalQuery;
  };

  const generateDiscountName = (query: string): string => {
    let discountName = query.replace(/ /g, "-").replace(/"/g, "");
    discountName += "-" + Date.now();
    return discountName;
  };

  const handleGetItems = async () => {
    try {
      setIsLoading(true);
      setError("");

      const query = generateQuery();
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/queryBulkDiscountValue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queryValue: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      if (data.data) {
        const processedProducts = data.data.map((product: any) => {
          const today = new Date();
          const receivedDate = new Date(product.receivedDate);
          const daysDifference = Math.round(
            (today.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const firstVariant = product.variants[0];
          const currentDiscount =
            firstVariant.compareAtPrice && firstVariant.compareAtPrice !== "0.00"
              ? (1 - parseFloat(firstVariant.price) / parseFloat(firstVariant.compareAtPrice)) * 100
              : 0;

          // Extract offers from tags
          const messageTag = product.tags.find((tag: string) => tag.startsWith("Message1:FB0808:"));
          let offers = "N/A";
          if (messageTag) {
            const match = messageTag.match(/Message1:FB0808:(\d+)%/);
            if (match && match[1]) {
              offers = match[1] + "%";
            }
          }

          return {
            id: product.productID,
            vendor: product.vendor,
            title: product.title,
            handle: product.handle,
            productImage: product.productImage || "",
            totalInventory: product.totalInventory,
            productType: product.productType.split(" - ").pop() || product.productType,
            receivedDate: product.receivedDate,
            price: parseFloat(firstVariant.price),
            compareAtPrice: parseFloat(firstVariant.compareAtPrice || 0),
            currentDiscount,
            offers,
            newPrice: 0,
            newCompareAt: 0,
            variants: product.variants.map((v: any) => v.variantID),
            tags: product.tags,
            excluded: false,
            daysSinceReceived: daysDifference >= 19660 ? -1 : daysDifference, // -1 for "Not Received"
          };
        });

        setProducts(processedProducts);
        setSuccess(`Successfully loaded ${processedProducts.length} products`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    filtered.forEach((product) => {
      let shouldExclude = false;

      // Filter by out of stock
      if (excludeOutOfStock && product.totalInventory <= 0) {
        shouldExclude = true;
      }

      // Filter by not received
      if (excludeNotReceived && product.daysSinceReceived === -1) {
        shouldExclude = true;
      }

      // Filter by no pictures
      if (excludeNoPictures && (!product.productImage || product.productImage.trim() === "")) {
        shouldExclude = true;
      }

      // Filter by discount amount above threshold
      if (excludeDiscountAbove && product.currentDiscount > maxDiscountPercent) {
        shouldExclude = true;
      }

      product.excluded = shouldExclude;
    });

    setFilteredProducts(filtered.filter((product) => !product.excluded));
  };

  const handleApplyDiscount = () => {
    if (discountPercent < 0) {
      setError("Discount percentage cannot be negative");
      return;
    }

    setIsApplyingDiscount(true);

    const updatedProducts = products.map((product) => {
      if (product.excluded) return product;

      let newPrice: number;
      let newCompareAt: number;

      if (discountPercent === 0) {
        // Remove discount
        if (product.compareAtPrice > 0) {
          newPrice = product.compareAtPrice;
          newCompareAt = 0;
        } else {
          newPrice = product.price;
          newCompareAt = 0;
        }
      } else {
        // Apply discount
        if (product.compareAtPrice > 0) {
          newPrice = Math.round((product.compareAtPrice * (100 - discountPercent)) / 100);
          newCompareAt = product.compareAtPrice;
        } else {
          newPrice = Math.round((product.price * (100 - discountPercent)) / 100);
          newCompareAt = product.price;
        }
      }

      return {
        ...product,
        newPrice: newPrice || 0,
        newCompareAt: newCompareAt || 0,
      };
    });

    setProducts(updatedProducts);
    setDiscountApplied(true);
    setIsApplyingDiscount(false);

    // Update discount name with sale name
    if (saleName.trim()) {
      const updatedDiscountName = `(${saleName})-${discountName}`;
      setDiscountName(updatedDiscountName);
    }
  };

  const handleSubmitDiscount = async () => {
    const eligibleProducts = products.filter((product) => !product.excluded);

    if (eligibleProducts.length === 0) {
      setError("No products available for discount application");
      return;
    }

    if (!discountApplied) {
      setError("Please apply discount first before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const bulkDiscountData = {
        bulkDiscountName: discountName,
        bulkDiscountProducts: eligibleProducts.map((product) => ({
          bulkDiscountName: discountName,
          brand: product.vendor,
          title: product.title,
          link: `https://loladre.com/products/${product.handle}`,
          imageSrc: product.productImage,
          productID: product.id,
          originalPrice: product.price,
          originalComparedAt: product.compareAtPrice || null,
          newPrice: product.newPrice,
          newComparedAt: product.newCompareAt || null,
          variants: product.variants.join(","),
          tagsToAdd: saleName.trim()
            ? `SeasonDiscount, OnSale, Message1:FB0808:${saleName}`
            : "SeasonDiscount, OnSale",
          tagsToRemove: product.tags.filter((tag) => tag.includes("Message1:FB0808:")).join(","),
        })),
      };

      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/bulkDiscountItems`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bulkDiscountData),
      });

      if (!response.ok) {
        throw new Error("Failed to apply bulk discount");
      }

      const result = await response.json();
      setSuccess(`Successfully applied discount to ${eligibleProducts.length} products`);

      // Reset form
      setProducts([]);
      setDiscountApplied(false);
      setDiscountPercent(0);
      setDiscountName("");
      setSaleName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply bulk discount");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Table columns
  const columns: Column[] = [
    {
      key: "excluded",
      header: "Exclude",
      render: (value, _, index) => (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => {
            const updatedProducts = [...products];
            updatedProducts[index!].excluded = e.target.checked;
            setProducts(updatedProducts);
          }}
          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
      ),
      className: "text-center",
    },
    {
      key: "vendor",
      header: "Brand",
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (value, product) => (
        <a
          href={`https://loladre.com/products/${product.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 font-medium max-w-xs block truncate"
          title={value}
        >
          {value}
        </a>
      ),
    },
    {
      key: "productImage",
      header: "Image",
      render: (value) => (
        <div className="flex justify-center">
          {value ? (
            <img
              src={value}
              alt="Product"
              className="w-16 h-16 object-cover rounded border border-slate-200"
            />
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
      key: "totalInventory",
      header: "QOH",
      render: (value) => (
        <span className={value <= 0 ? "text-red-600 font-semibold" : ""}>{value}</span>
      ),
      className: "text-center",
    },
    {
      key: "productType",
      header: "Category",
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: "daysSinceReceived",
      header: "Days",
      render: (value) => (
        <span className={value === -1 ? "text-orange-600 font-semibold" : ""}>
          {value === -1 ? "Not Received" : value.toString()}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "price",
      header: "Price",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "compareAtPrice",
      header: "Compared@",
      render: (value) => (value > 0 ? formatCurrency(value) : "N/A"),
      className: "text-right",
    },
    {
      key: "currentDiscount",
      header: "Discount",
      render: (value) => (
        <span className={value > 0 ? "text-red-600 font-semibold" : ""}>
          {value > 0 ? `${value.toFixed(2)}%` : "0%"}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "offers",
      header: "Offers",
      render: (value) => (
        <span className={value !== "N/A" ? "text-blue-600 font-semibold" : "text-slate-400"}>
          {value}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "newPrice",
      header: "New Price",
      render: (value) => (
        <span className={value > 0 ? "text-green-600 font-semibold" : ""}>
          {value > 0 ? formatCurrency(value) : "-"}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "newCompareAt",
      header: "New Compared@",
      render: (value) => (
        <span className={value > 0 ? "text-green-600 font-semibold" : ""}>
          {value > 0 ? formatCurrency(value) : "N/A"}
        </span>
      ),
      className: "text-right",
    },
  ];

  // Season options
  const seasonOptions = [
    { value: "resort", label: "Resort" },
    { value: "spring", label: "Spring" },
    { value: "summer", label: "Summer" },
    { value: "fall", label: "Fall" },
  ];

  // Year options
  const yearOptions = Array.from({ length: 8 }, (_, i) => {
    const year = 23 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Calculate statistics
  const totalProducts = products.length;
  const excludedProducts = products.filter((p) => p.excluded).length;
  const eligibleProducts = totalProducts - excludedProducts;
  const totalValue = filteredProducts.reduce((sum, product) => sum + product.price, 0);

  return (
    <Layout title="Bulk Discount">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Bulk Discount:{" "}
              <span className="text-purple-600">{generatedSeason || "Build Query"}</span>
            </h1>
            <p className="text-slate-600 mt-1">
              Apply discounts to multiple products based on criteria
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Query Builder */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Product Selection Criteria</h3>

                {criteriaLines.map((line, index) => (
                  <div key={line.id} className="space-y-3">
                    {index > 0 && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={line.operator || "AND"}
                          onChange={(e) => updateCriteriaLine(line.id, "operator", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      <select
                        value={line.item}
                        onChange={(e) => updateCriteriaLine(line.id, "item", e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">--Select Item--</option>
                        <option value="Season">Season</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Category">Category</option>
                        <option value="Tag">Tags</option>
                        <option value="Title">Title</option>
                      </select>

                      {/* Condition dropdown for non-tag/title items */}
                      {line.item && !["Tag", "Title"].includes(line.item) && (
                        <select
                          value={line.condition}
                          onChange={(e) => updateCriteriaLine(line.id, "condition", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="EQUALS">EQUALS</option>
                          <option value="NOT_EQUALS">NOT EQUALS</option>
                        </select>
                      )}

                      {/* Condition dropdown for tag/title items */}
                      {line.item && ["Tag", "Title"].includes(line.item) && (
                        <select
                          value={line.conditionTag}
                          onChange={(e) =>
                            updateCriteriaLine(line.id, "conditionTag", e.target.value)
                          }
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="CONTAINS">CONTAINS</option>
                          <option value="NOT_CONTAINS">NOT CONTAINS</option>
                        </select>
                      )}

                      {/* Season dropdowns */}
                      {line.item === "Season" && (
                        <>
                          <select
                            value={line.season}
                            onChange={(e) => updateCriteriaLine(line.id, "season", e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">--Select Season--</option>
                            {seasonOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={line.seasonYear}
                            onChange={(e) =>
                              updateCriteriaLine(line.id, "seasonYear", e.target.value)
                            }
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">--Select Year--</option>
                            {yearOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {/* Vendor dropdown */}
                      {line.item === "Vendor" && (
                        <select
                          value={line.vendor}
                          onChange={(e) => updateCriteriaLine(line.id, "vendor", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Any Brand</option>
                          {vendors.map((vendor) => (
                            <option key={vendor} value={vendor}>
                              {vendor}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Category dropdown */}
                      {line.item === "Category" && (
                        <select
                          value={line.category}
                          onChange={(e) => updateCriteriaLine(line.id, "category", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Any Category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Tag/Title input */}
                      {line.item && ["Tag", "Title"].includes(line.item) && (
                        <Input
                          type="text"
                          value={line.tagInput}
                          onChange={(e) => updateCriteriaLine(line.id, "tagInput", e.target.value)}
                          placeholder={`Enter ${line.item.toLowerCase()}...`}
                          className="flex-1 min-w-48"
                        />
                      )}

                      <Button onClick={addCriteriaLine} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>

                      {criteriaLines.length > 1 && (
                        <Button
                          onClick={() => removeCriteriaLine(line.id)}
                          size="sm"
                          variant="danger"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    onClick={handleGetItems}
                    isLoading={isLoading}
                    disabled={!criteriaLines.some((line) => line.item)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Get Items
                  </Button>
                </div>
              </div>
            </Card>

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

            {/* Summary Cards */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                  title="Total Products"
                  value={totalProducts}
                  icon={Package}
                  color="blue"
                />
                <StatusCard
                  title="Eligible Products"
                  value={eligibleProducts}
                  icon={CheckCircle}
                  color="green"
                />
                <StatusCard
                  title="Excluded Products"
                  value={excludedProducts}
                  icon={X}
                  color="red"
                />
                <StatusCard
                  title="Total Value"
                  value={formatCurrency(totalValue)}
                  icon={DollarSign}
                  color="purple"
                />
              </div>
            )}

            {/* Filters and Discount Controls */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Filters */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Exclusion Filters
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={excludeOutOfStock}
                          onChange={(e) => setExcludeOutOfStock(e.target.checked)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Exclude Out of Stock</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={excludeNotReceived}
                          onChange={(e) => setExcludeNotReceived(e.target.checked)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Exclude Not Received</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={excludeNoPictures}
                          onChange={(e) => setExcludeNoPictures(e.target.checked)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Exclude No Pictures</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={excludeDiscountAbove}
                            onChange={(e) => setExcludeDiscountAbove(e.target.checked)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Exclude Discount Above</span>
                        </label>
                        {excludeDiscountAbove && (
                          <div className="ml-6">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={maxDiscountPercent}
                                onChange={(e) =>
                                  setMaxDiscountPercent(parseFloat(e.target.value) || 0)
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-slate-600">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Discount Controls */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Percent className="w-5 h-5 mr-2" />
                      Discount Settings
                    </h3>
                    <div className="space-y-3">
                      <FormField label="Discount %">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                            disabled={discountApplied}
                          />
                          <Button
                            onClick={handleApplyDiscount}
                            isLoading={isApplyingDiscount}
                            disabled={discountApplied}
                          >
                            Apply Discount
                          </Button>
                        </div>
                      </FormField>
                      <FormField label="Discount Name">
                        <Input
                          type="text"
                          value={discountName}
                          onChange={(e) => setDiscountName(e.target.value)}
                          disabled={discountApplied}
                        />
                      </FormField>
                      <FormField label="Sale Name">
                        <Input
                          type="text"
                          value={saleName}
                          onChange={(e) => setSaleName(e.target.value)}
                          disabled={discountApplied}
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Products Table */}
            {products.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Products</h3>
                    <div className="text-sm text-slate-600">
                      Showing {filteredProducts.length} of {totalProducts} products
                    </div>
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={products.map((product, index) => ({ ...product, index }))}
                  emptyMessage="No products match the current filters"
                />
              </Card>
            )}

            {/* Submit Button */}
            {products.length > 0 && (
              <Card className="text-center">
                <Button
                  onClick={handleSubmitDiscount}
                  isLoading={isSubmitting}
                  disabled={!discountApplied || eligibleProducts === 0}
                  size="lg"
                  className="px-8"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Apply Discount ({eligibleProducts} products)
                </Button>
              </Card>
            )}

            {/* Empty State */}
            {products.length === 0 && !isLoading && (
              <Card className="text-center py-12">
                <Percent className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Build Your Product Query
                </h3>
                <p className="text-slate-600 mb-6">
                  Use the criteria builder above to select products for bulk discount application.
                </p>
                <div className="text-sm text-slate-500">
                  Features available:
                  <ul className="mt-2 space-y-1">
                    <li>• Filter products by season, vendor, category, tags, or title</li>
                    <li>• Apply percentage-based discounts to multiple products</li>
                    <li>• Exclude products based on stock, images, or existing discounts</li>
                    <li>• Preview changes before applying to Shopify</li>
                  </ul>
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
