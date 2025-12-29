// src/client/pages/RegisterMerchant.jsx
import React, { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

import {
  adminProtectedApi,
  redirectToAdminLogin,
} from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";

export default function RegisterMerchant({ metadata }) {
  const adminToken = adminLocalStorage.getItem("adminAccessToken");
  if (!adminToken) redirectToAdminLogin();

  const categories = metadata?.categories ?? [];
  const subcategories = metadata?.subcategories ?? [];
  const offerings = metadata?.offerings ?? [];

  const [credentials, setCredentials] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // zoom (1 = cover fit, >1 = zoom in)
  const [bannerZoom, setBannerZoom] = useState(1);
  const [thumbZoom, setThumbZoom] = useState(1);

  // banner crop state
  const [bannerCrop, setBannerCrop] = useState({ x: 0, y: 0 });
  const [bannerCropPx, setBannerCropPx] = useState(null);

  // thumb crop state
  const [thumbCrop, setThumbCrop] = useState({ x: 0, y: 0 });
  const [thumbCropPx, setThumbCropPx] = useState(null);

  // NEW: thumbnail upload
  const [thumbFile, setThumbFile] = useState(null);

  // NEW: crop state (banner)
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 });

  // NEW: crop state (thumb)
  const [thumbPreview, setThumbPreview] = useState(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });

  // drag helpers
  const [dragging, setDragging] = useState(null); // "banner" | "thumb" | null
  const dragStart = React.useRef({ x: 0, y: 0 });

  /* ---------------- FORM STATE ---------------- */

  const [form, setForm] = useState({
    name: "",
    merchantNameId: "",
    ownerName: "",
    ownerUsername: "",
    phone: "",
    address: "",
    location: ["", ""],
    categoryId: "",
    subcategoryId: "",
    offeringIds: [],
    banner: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  /* ---------------- DERIVED ---------------- */

  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryCode === form.categoryId),
    [subcategories, form.categoryId]
  );

  const filteredOfferings = useMemo(
    () => offerings.filter((o) => o.categoryCode === form.categoryId),
    [offerings, form.categoryId]
  );

  async function generateBannerImages(file, offset, zoom) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((r) => (img.onload = r));

    return {
      hero: await cropWithPixels(img, bannerCropPx, 900, 450),
      list: await cropWithPixels(img, bannerCropPx, 800, 400),
    };
  }

  async function generateThumbImage(file, offset, zoom) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((r) => (img.onload = r));

    return cropWithPixels(img, thumbCropPx, 300, 300);
  }

  function startDrag(type, e) {
    setDragging(type);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }

  function onDrag(e) {
    if (!dragging) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    dragStart.current = { x: e.clientX, y: e.clientY };

    const SENSITIVITY = 1 / 300;

    if (dragging === "banner") {
      setBannerOffset((o) => ({
        x: Math.max(-1, Math.min(1, o.x + dx * SENSITIVITY)),
        y: Math.max(-1, Math.min(1, o.y + dy * SENSITIVITY)),
      }));
    } else {
      setThumbOffset((o) => ({
        x: Math.max(-1, Math.min(1, o.x + dx * SENSITIVITY)),
        y: Math.max(-1, Math.min(1, o.y + dy * SENSITIVITY)),
      }));
    }
  }

  function stopDrag() {
    setDragging(null);
  }
  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging]);

  /* ---------------- LOCATION ---------------- */

  function pickDeviceLocation() {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, location: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          location: [
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6)),
          ],
        }));
        setErrors((e) => ({ ...e, location: null }));
      },
      () =>
        setErrors((e) => ({
          ...e,
          location: "Location permission denied",
        }))
    );
  }

  function handlePhoneChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    updateField("phone", digitsOnly.slice(0, 10));
  }

  /* ---------------- VALIDATION ---------------- */

  useEffect(() => {
    if (success) setSuccess(null);
    const e = {};

    if (!/^[A-Za-z0-9][A-Za-z0-9 &,\-'.]{1,59}$/.test(form.name)) {
      e.name = "2–60 chars. Letters, numbers, space and & , - ' . only";
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.merchantNameId))
      e.merchantNameId = "3–15 chars, lowercase, '-' allowed";

    if (form.merchantNameId.length < 3 || form.merchantNameId.length > 15)
      e.merchantNameId = "Merchant username must be 3–15 characters";

    if (!/^[A-Za-z ]{3,20}$/.test(form.ownerName))
      e.ownerName = "3–20 chars. Letters only";

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.ownerUsername))
      e.ownerUsername = "3–15 chars, lowercase, '-' allowed";

    if (form.ownerUsername.length < 3 || form.ownerUsername.length > 15)
      e.ownerUsername = "Owner username must be 3–15 characters";

    if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = "10-digit Indian number required";

    if (form.address.length > 200)
      e.address = "Address cannot exceed 200 characters";

    if (!form.location[0] || !form.location[1])
      e.location = "Precise location required";

    if (!form.categoryId) e.categoryId = "Category is required";
    if (!form.subcategoryId)
      e.subcategoryId = "Exactly one subcategory required";

    if (form.offeringIds.length > 5)
      e.offeringIds = "Maximum 5 offerings allowed";

    if (!bannerFile) e.banner = "Banner image is required";
    if (!thumbFile) e.thumb = "Thumbnail image is required";

    setErrors(e);
  }, [form, bannerFile, thumbFile]);

  /* ---------------- HELPERS ---------------- */

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleOffering(code) {
    setForm((f) => {
      if (f.offeringIds.includes(code)) {
        return {
          ...f,
          offeringIds: f.offeringIds.filter((o) => o !== code),
        };
      }
      if (f.offeringIds.length >= 5) return f;
      return { ...f, offeringIds: [...f.offeringIds, code] };
    });
  }

  /* ---------------- SUBMIT ---------------- */

  async function submit(e) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setErrors({}); // clear previous submit errors

    let heroKey, listKey, thumbKey;

    try {
      console.log("Calling presign");

      // presign ONCE
      const presign = await adminProtectedApi.presignMerchantImages({
        merchantNameId: form.merchantNameId,
        files: [
          { name: "hero.jpg" },
          { name: "list.jpg" },
          { name: "thumb.jpg" },
        ],
      });

      console.log("PRESIGN RESPONSE:", presign);

      if (
        !presign ||
        !presign.files ||
        !presign.files.hero ||
        !presign.files.list ||
        !presign.files.thumb
      ) {
        throw new Error("Invalid presign response from server");
      }

      // generate images
      const bannerImages = await generateBannerImages(
        bannerFile,
        bannerOffset,
        bannerZoom
      );
      const thumbImage = await generateThumbImage(
        thumbFile,
        thumbOffset,
        thumbZoom
      );

      // upload (fail-fast)

      if (!bannerCropPx || !thumbCropPx) {
        throw new Error("Please crop images before submitting");
      }
      const uploadResults = await Promise.all([
        fetch(presign.files.hero.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: bannerImages.hero,
        }),
        fetch(presign.files.list.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: bannerImages.list,
        }),
        fetch(presign.files.thumb.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbImage,
        }),
      ]);

      for (const res of uploadResults) {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Image upload failed: ${res.status} ${text}`);
        }
      }

      heroKey = presign.files.hero.key;
      listKey = presign.files.list.key;
      thumbKey = presign.files.thumb.key;

      const res = await adminProtectedApi.createMerchant({
        merchantNameId: form.merchantNameId,
        name: form.name,
        ownerName: form.ownerName,
        ownerUsername: form.ownerUsername,
        phone: form.phone,
        address: form.address,
        latitude: Number(form.location[0]),
        longitude: Number(form.location[1]),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId,
        offeringsId: form.offeringIds,
        heroImage: heroKey,
        listImage: listKey,
        thumbnailImage: thumbKey,
      });

      setSuccess("Merchant registered successfully");
      setCredentials({
        username: res.username,
        password: res.password,
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Registration failed",
      }));
    } finally {
      setLoading(false);
    }
  }
  function cropWithPixels(img, crop, targetW, targetH) {
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      targetW,
      targetH
    );

    return new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.8)
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Register Merchant</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Business Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}

        <input
          className="w-full rounded border p-2"
          placeholder="Merchant Username"
          value={form.merchantNameId}
          onChange={(e) =>
            updateField("merchantNameId", e.target.value.toLowerCase())
          }
        />
        {errors.merchantNameId && (
          <p className="text-red-600 text-sm">{errors.merchantNameId}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Owner Name"
          value={form.ownerName}
          onChange={(e) => updateField("ownerName", e.target.value)}
        />
        {errors.ownerName && (
          <p className="text-red-600 text-sm">{errors.ownerName}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Owner Username"
          value={form.ownerUsername}
          onChange={(e) =>
            updateField("ownerUsername", e.target.value.toLowerCase())
          }
        />
        {errors.ownerUsername && (
          <p className="text-red-600 text-sm">{errors.ownerUsername}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Phone (10-digit)"
          value={form.phone}
          onChange={handlePhoneChange}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
        />
        {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

        {/* ADDRESS */}
        <textarea
          className="w-full rounded border p-2"
          placeholder="Business Address"
          rows={2}
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
        />

        {errors.address && (
          <p className="text-red-600 text-sm">{errors.address}</p>
        )}

        <div className="flex gap-2">
          <input
            className="w-1/2 rounded border p-2"
            placeholder="Latitude"
            value={form.location[0]}
            onChange={(e) =>
              updateField("location", [e.target.value, form.location[1]])
            }
          />
          <input
            className="w-1/2 rounded border p-2"
            placeholder="Longitude"
            value={form.location[1]}
            onChange={(e) =>
              updateField("location", [form.location[0], e.target.value])
            }
          />
        </div>

        <button
          type="button"
          onClick={pickDeviceLocation}
          className="rounded bg-gray-200 px-3 py-1 text-sm"
        >
          Use Device Location
        </button>
        {errors.location && (
          <p className="text-red-600 text-sm">{errors.location}</p>
        )}

        <select
          className="w-full rounded border p-2"
          value={form.categoryId}
          onChange={(e) => {
            updateField("categoryId", e.target.value);
            updateField("subcategoryId", "");
            updateField("offeringIds", []);
          }}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.subcategoryId}
          onChange={(e) => updateField("subcategoryId", e.target.value)}
          disabled={!form.categoryId}
        >
          <option value="">Select Subcategory</option>
          {filteredSubcategories.map((s) => (
            <option key={s.subcategoryCode} value={s.subcategoryCode}>
              {s.subcategoryName}
            </option>
          ))}
        </select>

        {filteredOfferings.length > 0 && (
          <div>
            <p className="font-semibold text-sm">Offerings (max 5)</p>
            <div className="flex flex-wrap gap-2">
              {filteredOfferings.map((o) => {
                const active = form.offeringIds.includes(o.offeringCode);
                return (
                  <button
                    key={o.offeringCode}
                    type="button"
                    onClick={() => toggleOffering(o.offeringCode)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      active ? "bg-black text-white" : "bg-gray-100"
                    }`}
                  >
                    {o.offeringName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BANNER IMAGE */}
        <label className="text-sm font-medium">
          Banner Image (Hero + List)
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png"
          className="w-full rounded border p-2 text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setBannerFile(f);
            setBannerPreview(f ? URL.createObjectURL(f) : null);
            setBannerOffset({ x: 0, y: 0 });
            setBannerZoom(1);
          }}
        />

        {bannerPreview && (
          <div className="relative w-full h-48 bg-black">
            <Cropper
              image={bannerPreview}
              crop={bannerCrop}
              zoom={bannerZoom}
              aspect={2 / 1}
              onCropChange={setBannerCrop}
              onZoomChange={setBannerZoom}
              onCropComplete={(_, croppedAreaPixels) =>
                setBannerCropPx(croppedAreaPixels)
              }
            />
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-600">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={bannerZoom}
            onChange={(e) => setBannerZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="text-sm font-medium mt-4">Feed Thumbnail</label>

        <input
          type="file"
          accept="image/jpeg,image/png"
          className="w-full rounded border p-2 text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setThumbFile(f);
            setThumbPreview(f ? URL.createObjectURL(f) : null);
            setThumbOffset({ x: 0, y: 0 });
            setThumbZoom(1);
          }}
        />
        <p className="text-xs text-gray-500">
          Drag to reposition • Use zoom to adjust framing
        </p>
        {thumbPreview && (
          <div className="relative w-40 h-40 bg-black">
            <Cropper
              image={thumbPreview}
              crop={thumbCrop}
              zoom={thumbZoom}
              aspect={1}
              onCropChange={setThumbCrop}
              onZoomChange={setThumbZoom}
              onCropComplete={(_, croppedAreaPixels) =>
                setThumbCropPx(croppedAreaPixels)
              }
            />
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-600">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={thumbZoom}
            onChange={(e) => setThumbZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        {errors.thumb && <p className="text-red-600 text-sm">{errors.thumb}</p>}

        <button
          type="submit"
          disabled={loading || Object.keys(errors).length > 0}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register Merchant"}
        </button>

        {success && <p className="text-green-600 text-sm">{success}</p>}
        {errors.submit && (
          <p className="text-red-600 text-sm">{errors.submit}</p>
        )}
      </form>

      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-2">
              Merchant Login Credentials
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              These credentials are shown <b>only once</b>. Copy securely.
            </p>

            <div className="space-y-3">
              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Username</p>
                <p className="font-mono text-lg">{credentials.username}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Temporary Password</p>
                <p className="font-mono text-lg">{credentials.password}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`
                  )
                }
                className="rounded border px-4 py-2 text-sm"
              >
                Copy
              </button>

              <button
                onClick={() => setCredentials(null)}
                className="rounded bg-black px-4 py-2 text-sm text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
