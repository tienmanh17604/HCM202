import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, Stars } from '@react-three/drei';
import { useGameStore } from '../../../store/useGameStore';
import * as THREE from 'three';
import { playGameSfx } from '../../audio/AmbientAudio';

const NeuralNetworkBrain = () => {
  const { positions, lines, colors } = useMemo(() => {
    const pts = [];
    const numPoints = 2500; // Đủ dày để thấy rõ hình khối

    // Thuật toán: Sinh ngẫu nhiên các điểm trên bề mặt hình cầu, sau đó NẮN BÓP các điểm đó
    // y hệt như cách ta điêu khắc khối đặc ban nãy.
    for (let i = 0; i < numPoints; i++) {
      // 80% nơ-ron nằm trên bề mặt để giữ viền nét, 20% lơ lửng ngay dưới màng
      const r = i < numPoints * 0.8 ? 1 : 0.8 + 0.2 * Math.random();

      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const vec = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const normal = vec.clone().normalize();

      // 1. ĐIÊU KHẮC CÁC NẾP NHĂN CỦA NÃO (Gyri & Sulci)
      const scale = 16.0;
      const nx = vec.x * scale;
      const ny = vec.y * scale;
      const nz = vec.z * scale;

      const wave1 = Math.sin(nx + Math.cos(ny * 1.5));
      const wave2 = Math.cos(ny + Math.sin(nz * 1.5));
      const wave3 = Math.sin(nz + Math.cos(nx * 1.5));

      let noise = (wave1 + wave2 + wave3) / 3.0;
      let wrinkle = 1.0 - Math.abs(noise);

      // Tăng độ gồ ghề của nếp nhăn lên 0.16 để nổi bật lồi lõm
      vec.addScaledVector(normal, wrinkle * 0.16);
      vec.wrinkle = wrinkle; // Lưu lại độ gồ ghề để lát nữa tô màu đổ bóng

      // 2. TẠO HÌNH DÁNG TỔNG THỂ HÀI HÒA (Nhô ra lõm vào mượt mà chuẩn giải phẫu)
      vec.x *= 2.0;
      vec.y *= 1.6;
      vec.z *= 2.5;

      // Thùy trán (Tròn trịa phần trước, khắc phục lỗi mũi nhọn)
      if (vec.z < 0) {
        // Dùng đường cong cosine để vuốt cong mềm mại như quả trứng thay vì vuốt thẳng hình nón
        const taper = 0.82 + 0.18 * Math.cos(vec.z * 0.6);
        vec.x *= taper;
        vec.y *= taper;
      }

      // Thùy Thái Dương (Nhô nhẹ mượt mà ở 2 bên hông dưới)
      // Dùng hàm khoảng cách để tạo độ phình tự nhiên (không bị gãy góc như cái cánh)
      const temporalDist = Math.pow(vec.z - 0.5, 2) + Math.pow(vec.y + 0.3, 2);
      const temporalTaper = Math.max(0, 1.0 - temporalDist * 0.5);
      vec.x += Math.sign(vec.x) * temporalTaper * 0.25;

      // Tiểu não (Nhô nhẹ lồi xuống ở đáy sau)
      const cerebellumDist = Math.pow(vec.z - 1.2, 2) + Math.pow(vec.y + 0.4, 2);
      const cerebellumTaper = Math.max(0, 1.0 - cerebellumDist * 0.8);
      vec.y -= cerebellumTaper * 0.3;  // Trễ xuống
      vec.z += cerebellumTaper * 0.15; // Lùi ra sau
      vec.x += Math.sign(vec.x) * cerebellumTaper * 0.1; // Bè nhẹ ra

      // Làm bẹt phần đáy (Trừ vùng tiểu não ở đằng sau đã được kéo trễ)
      if (vec.y < 0 && vec.z < 1.0) {
        vec.y *= 0.6;
      }

      // Rãnh dọc chia 2 bán cầu
      const fissure = Math.max(0, 0.45 - Math.abs(vec.x));
      if (Math.abs(vec.x) < 0.45) {
        vec.x += Math.sign(vec.x) * Math.pow(fissure, 2) * 1.5;
        vec.y -= Math.pow(fissure, 2) * 0.8;
      }

      pts.push(vec);
    }

    // Thuật toán kết nối các nơ-ron (Synapses)
    const linePositions = [];
    const maxDistance = 0.65; // Khoảng cách lý tưởng để nối dây

    for (let i = 0; i < pts.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < maxDistance) {
          linePositions.push(pts[i].x, pts[i].y, pts[i].z);
          linePositions.push(pts[j].x, pts[j].y, pts[j].z);
          connections++;
          if (connections > 4) break;
        }
      }
    }

    const positionsArray = new Float32Array(pts.length * 3);
    const colorsArray = new Float32Array(pts.length * 3);

    // Dùng 3 màu sắc như bạn yêu cầu (Xanh, Tím, Hồng)
    const colorPalette = [
      new THREE.Color('#38bdf8'), // Cyan
      new THREE.Color('#c084fc'), // Purple
      new THREE.Color('#f472b6'), // Pink
    ];

    for (let i = 0; i < pts.length; i++) {
      positionsArray[i * 3] = pts[i].x;
      positionsArray[i * 3 + 1] = pts[i].y;
      positionsArray[i * 3 + 2] = pts[i].z;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      // Hiệu ứng quang học 3D giả lập:
      // Điểm nơ-ron nào nằm dưới rãnh sâu (wrinkle thấp) sẽ TỐI MÀU đi.
      // Điểm nơ-ron nào nằm trên nếp cuộn nhô cao (wrinkle cao) sẽ SÁNG RỰC lên.
      // Điều này giúp Mạng Nơ-ron trông nổi bần bật lồi lõm y như có ánh sáng chiếu vào!
      const brightness = 0.4 + pts[i].wrinkle * 0.6; // Nằm từ 0.4 (Tối) đến 1.0 (Sáng)

      colorsArray[i * 3] = color.r * brightness;
      colorsArray[i * 3 + 1] = color.g * brightness;
      colorsArray[i * 3 + 2] = color.b * brightness;
    }

    return {
      positions: positionsArray,
      lines: new Float32Array(linePositions),
      colors: colorsArray
    };
  }, []);

  return (
    <group>
      {/* CÁC NƠ-RON (3 màu sắc) */}
      <points raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors={true} transparent opacity={0.65} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* CÁC ĐƯỜNG NỐI (Giống các vì sao nối với nhau) */}
      <lineSegments raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
        </bufferGeometry>
        {/* Dùng 1 màu mờ nhẹ cho đường nối để điểm nơ-ron nổi bật */}
        <lineBasicMaterial color="#818cf8" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
};

const BrainModel = () => {
  const groupRef = useRef();
  const viewState = useGameStore(state => state.viewState);
  const setViewState = useGameStore(state => state.setViewState);
  const [hovered, setHovered] = useState(false);
  const [isZooming, setIsZooming] = useState(false); // Trạng thái đang chuyển cảnh

  // Sửa lỗi khi "Quay về Sảnh Chính" bị lưu trạng thái zooming
  React.useEffect(() => {
    if (viewState === 'START') {
      setIsZooming(false);
      // Reset ngay lập tức tỷ lệ và vị trí để không bị lỗi giật khung hình
      if (groupRef.current) {
        groupRef.current.scale.set(3.0, 3.0, 3.0);
        groupRef.current.position.z = 0;
      }
      if (starsRef.current) {
        starsRef.current.scale.set(1, 1, 1);
        starsRef.current.position.z = 0;
      }
    }
  }, [viewState]);

  const handleClick = (e) => {
    e.stopPropagation();
    playGameSfx('portal');
    // Nếu người dùng kéo thả chuột (drag) để xoay não, e.delta sẽ lớn hơn 5.
    // Ta return luôn để KHÔNG kích hoạt sự kiện click (vào trong màn).
    if (e.delta > 5) return; 
    
    // Nếu click thật sự (delta thấp), kích hoạt hiệu ứng chuyển cảnh
    setIsZooming(true);
    
    // Đợi 1.2 giây để animation chạy xong rồi mới đổi state
    setTimeout(() => {
      setViewState('HUB');
    }, 1200);
  };

  const starsRef = useRef();

  useFrame((state) => {
    if (isZooming) {
      // HIỆU ỨNG XUYÊN KHÔNG GIAN (Hyperspace Jump)
      if (starsRef.current) {
        // 1. Kéo giãn các vì sao thành những vệt sáng dài trên trục Z (như Star Wars)
        starsRef.current.scale.lerp(new THREE.Vector3(1, 1, 30), 0.08);
        // 2. Lao toàn bộ vũ trụ qua mặt camera
        starsRef.current.position.z += 1.5;
      }
      if (groupRef.current) {
        // 3. Phóng to bộ não để nó nuốt chửng màn hình và lao thẳng qua camera
        groupRef.current.scale.lerp(new THREE.Vector3(15, 15, 15), 0.08);
        groupRef.current.position.z += 0.8;
      }
    } else {
      // Trạng thái bình thường
      if (starsRef.current) {
        // Phục hồi từ từ nếu có trục trặc
        starsRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        starsRef.current.position.z = THREE.MathUtils.lerp(starsRef.current.position.z, 0, 0.1);
      }
      if (groupRef.current) {
        // Phục hồi từ từ vị trí Z
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.1);
        
        groupRef.current.rotation.y += 0.003;
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        
        const targetScale = hovered ? 3.2 : 3.0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      }
    }
  });

  if (viewState !== 'START') return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Group chứa vũ trụ để làm hiệu ứng Warp (Chui vào vũ trụ) */}
      <group ref={starsRef}>
        <Stars radius={20} depth={10} count={3000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={10} size={5} speed={0.4} color="#00ffff" opacity={0.5} />
        <Sparkles count={150} scale={8} size={8} speed={0.8} color="#ff00ff" opacity={0.4} />
      </group>

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group ref={groupRef} position={[0, 1, 0]}>

          {/* Mạng Lưới Thần Kinh 3D (Đã dùng khung xương của bộ não điêu khắc để nặn) */}
          <NeuralNetworkBrain />

          {/* Hitbox chống lag */}
          <mesh
            visible={false}
            scale={[3, 2.5, 4]}
            onClick={handleClick}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default BrainModel;
