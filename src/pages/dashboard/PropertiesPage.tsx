import { useState } from "react";
import { useProperties } from "@/hooks/useProperties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Bed, 
  Bath,
  Loader2,
  Home,
  Pencil,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Property } from "@/types/database";
import PropertyForm, { PropertyFormData } from "@/components/booking/PropertyForm";
import { toast } from "sonner";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  studio: "Studio",
  "1_bed": "1 Bedroom",
  "2_bed": "2 Bedroom",
  "3_bed": "3 Bedroom",
  "4_bed": "4 Bedroom",
  "5_bed": "5 Bedroom",
  "6_bed": "6 Bedroom",
  "7_bed": "7+ Bedroom",
};

const FURNISHED_LABELS: Record<string, string> = {
  furnished: "Furnished",
  unfurnished: "Unfurnished",
  part_furnished: "Part Furnished",
};

const propertyToFormData = (p: Property): PropertyFormData => ({
  address_line_1: p.address_line_1,
  address_line_2: p.address_line_2 || "",
  city: p.city,
  postcode: p.postcode,
  property_type: p.property_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  kitchens: p.kitchens,
  living_rooms: p.living_rooms,
  dining_areas: p.dining_areas,
  utility_rooms: p.utility_rooms,
  storage_rooms: p.storage_rooms,
  hallways_stairs: p.hallways_stairs,
  gardens: p.gardens,
  communal_areas: p.communal_areas,
  furnished_status: p.furnished_status,
  heavily_furnished: p.heavily_furnished,
  notes: p.notes || "",
});

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { properties, loading, deleteProperty, updateProperty, createProperty } = useProperties();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [addingProperty, setAddingProperty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEdit = async (data: PropertyFormData) => {
    if (!editingProperty) return;
    setSaving(true);
    const { error } = await updateProperty(editingProperty.id, data);
    setSaving(false);
    if (error) {
      toast.error("Failed to update property");
    } else {
      toast.success("Property updated");
      setEditingProperty(null);
    }
  };

  const handleAdd = async (data: PropertyFormData) => {
    setSaving(true);
    const { error } = await createProperty(data);
    setSaving(false);
    if (error) {
      toast.error("Failed to add property");
    } else {
      toast.success("Property added");
      setAddingProperty(false);
    }
  };

  if (role !== "client") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Properties Not Available</h3>
            <p className="text-sm text-muted-foreground">
              Property management is only available for clients.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground">Manage your registered properties</p>
        </div>
        <Button onClick={() => setAddingProperty(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Properties Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first property to start booking inventory inspections.
            </p>
            <Button onClick={() => setAddingProperty(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium line-clamp-1">
                      {property.address_line_1}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {property.city}, {property.postcode}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {PROPERTY_TYPE_LABELS[property.property_type] || property.property_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} bed
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms} bath
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {FURNISHED_LABELS[property.furnished_status] || property.furnished_status}
                </Badge>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/book?propertyId=${property.id}`)}
                  >
                    Book Inspection
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingProperty(property)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteProperty(property.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && setEditingProperty(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          {editingProperty && (
            <PropertyForm
              key={editingProperty.id}
              initialData={propertyToFormData(editingProperty)}
              onSubmit={handleEdit}
              onCancel={() => setEditingProperty(null)}
              isLoading={saving}
              submitLabel="Update Property"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Property Dialog */}
      <Dialog open={addingProperty} onOpenChange={(open) => !open && setAddingProperty(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <PropertyForm
            onSubmit={handleAdd}
            onCancel={() => setAddingProperty(false)}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesPage;
