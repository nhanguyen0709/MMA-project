import React, { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import { getAllPhotosForCurrentUser } from "../services/photoService";

export default function MapScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getAllPhotosForCurrentUser();
      setPhotos(data);
    })();
  }, []);

  return (
    <MapView style={{ flex: 1 }}>
      {photos.map((p) => (
        <Marker key={p.id} coordinate={p.coords} title={p.note || "Ảnh"} onPress={() => navigation.navigate("Detail", { photo: p })} />
      ))}
    </MapView>
  );
}


