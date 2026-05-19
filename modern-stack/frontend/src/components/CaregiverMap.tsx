import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon path issue in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Caregiver {
  userId: string;
  firstName: string;
  lastName: string;
  profession: string;
  presentAddress: string;
  experienceYears: number;
  rating: number;
  profilePictureUrl?: string;
}

interface CaregiverMapProps {
  caregivers: Caregiver[];
  onBookClick?: (caregiverId: string) => void;
}

// Deterministic mock coordinates mapping around Dhaka, Bangladesh
const getCoordinates = (address: string, userId: string) => {
  const addr = (address || '').toLowerCase();
  if (addr.includes('banani')) return [23.7940, 90.4043];
  if (addr.includes('gulshan')) return [23.7925, 90.4194];
  if (addr.includes('dhanmondi')) return [23.7461, 90.3742];
  if (addr.includes('uttara')) return [23.8759, 90.3795];
  if (addr.includes('mirpur')) return [23.8069, 90.3687];
  if (addr.includes('mohammadpur')) return [23.7542, 90.3621];
  if (addr.includes('badda')) return [23.7805, 90.4267];
  if (addr.includes('khilgaon')) return [23.7466, 90.4206];
  if (addr.includes('farmgate')) return [23.7561, 90.3872];

  // Hash base to distribute randomly but deterministically
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((seed % 120) / 1200) - 0.05; // -0.05 to +0.05
  const lngOffset = ((seed % 80) / 1200) - 0.033;
  return [23.8103 + latOffset, 90.4125 + lngOffset];
};

export default function CaregiverMap({ caregivers, onBookClick }: CaregiverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [23.8103, 90.4125], // Dhaka Center
        zoom: 12,
        layers: [
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 20
          })
        ]
      });
      markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;

    if (markerGroup) {
      markerGroup.clearLayers();
    }

    if (caregivers.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    caregivers.forEach(cg => {
      const coords = getCoordinates(cg.presentAddress || '', cg.userId) as L.LatLngTuple;
      bounds.push(coords);

      const avatarHtml = cg.profilePictureUrl
        ? `<img src="${cg.profilePictureUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<span style="font-weight: 800; color: #93c5fd;">${cg.firstName?.[0]?.toUpperCase() || '👨‍⚕️'}</span>`;

      // Custom popup content
      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'Inter, system-ui, sans-serif';
      popupContent.style.padding = '8px';
      popupContent.style.color = '#fff';
      popupContent.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #1e3a5f, #1e1b4b); display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid rgba(59,130,246,0.3); overflow: hidden; flex-shrink: 0;">
            ${avatarHtml}
          </div>
          <div>
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px;">${cg.firstName} ${cg.lastName}</div>
            <div style="color: #22d3ee; font-size: 11px; font-weight: 700; text-transform: uppercase;">${cg.profession || 'Caregiver'}</div>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; margin-bottom: 12px;">
          <div>📍 ${cg.presentAddress || 'Dhaka'}</div>
          <div style="margin-top: 4px;">🔧 ${cg.experienceYears || 0} Yrs Experience</div>
          <div style="margin-top: 4px; color: #fbbf24; font-weight: 800;">★ ${cg.rating?.toFixed(1) || '0.0'}</div>
        </div>
      `;

      if (onBookClick) {
        const bookBtn = document.createElement('button');
        bookBtn.className = 'btn btn-primary btn-sm';
        bookBtn.style.width = '100%';
        bookBtn.style.padding = '6px 12px';
        bookBtn.style.fontSize = '12px';
        bookBtn.style.borderRadius = '8px';
        bookBtn.innerText = '📅 Request Booking';
        bookBtn.onclick = () => {
          onBookClick(cg.userId);
        };
        popupContent.appendChild(bookBtn);
      }

      // Custom pin/marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="width: 32px; height: 32px; background: rgba(59,130,246,0.15); border: 2px solid #3b82f6; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(59,130,246,0.4);"><div style="width: 14px; height: 14px; background: #3b82f6; border-radius: 50%;"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      L.marker(coords, { icon: customIcon })
        .addTo(markerGroup!)
        .bindPopup(popupContent, {
          closeButton: false,
          className: 'leaflet-dark-popup'
        });
    });

    // Zoom map to fit all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [caregivers, onBookClick]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-glass-strong)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', margin: '20px 0 35px 0' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1000, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        <span style={{ fontSize: '18px' }}>📍</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Caregiver Interactive Location Map</span>
      </div>
      <div ref={mapContainerRef} style={{ height: '400px', width: '100%', background: '#090d16' }} />
      
      {/* Styles injected to customize leaflet popups and darken them */}
      <style>{`
        .leaflet-dark-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        }
        .leaflet-dark-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
        }
        .leaflet-popup-content {
          margin: 10px !important;
        }
      `}</style>
    </div>
  );
}
