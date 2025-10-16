import React, { useEffect, useState, useContext } from "react";
import MapView, { Marker } from "react-native-maps";
import { getAllPhotos } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";

export default function MapScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      if (user) {
        const data = await getAllPhotos(user.id);
        setPhotos(data);
      }
    })();
  }, [user]);

  return (
    <MapView style={{ flex: 1 }}>
      {photos.map((p) => (
        <Marker key={p.id} coordinate={p.coords} title={p.note || "Ảnh"} onPress={() => navigation.navigate("Detail", { photo: p })} />
      ))}
    </MapView>
  );
}


