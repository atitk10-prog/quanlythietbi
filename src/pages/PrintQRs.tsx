import React, { useEffect, useState } from 'react';
import { api, type Device } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrintQRs() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const data = await api.getDevices();
                setDevices(data);
            } catch (error) {
                console.error('Failed to fetch devices for printing', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 print:bg-white print:p-0">
            {/* Tool Bar - Hidden when printing */}
            <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between print:hidden">
                <button
                    onClick={() => navigate('/devices')}
                    className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Quay lại danh sách
                </button>
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                >
                    <Printer className="h-5 w-5 mr-2" />
                    Bắt đầu in (A4)
                </button>
            </div>

            {/* Printable Area */}
            <div className="max-w-5xl mx-auto bg-white shadow-sm p-8 rounded-xl print:shadow-none print:p-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:gap-4">
                    {devices.map((device) => (
                        <div
                            key={device.id}
                            className="flex flex-col items-center p-4 border border-slate-200 rounded-lg break-inside-avoid print:border-slate-300"
                        >
                            <QRCodeSVG
                                value={`${window.location.origin}/device/${device.id}`}
                                size={100}
                                level="L"
                                includeMargin={false}
                            />
                            <div className="mt-2 text-center">
                                <p className="text-xs font-bold text-slate-900 truncate w-full">{device.id}</p>
                                <p className="text-[10px] text-slate-500 truncate w-full max-w-[100px]">{device.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Print styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 15mm; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}} />
        </div>
    );
}
